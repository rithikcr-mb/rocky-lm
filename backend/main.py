import os
import re
import json
import asyncio
import io
import sys
import logging
import PyPDF2
import sqlite3
import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from google import genai
from google.genai import types
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager

# Import MCP SDK components
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Import constants from config
from config import (
    STUDY_MATERIALS_DIR,
    MEMORY_DB_PATH,
    MODEL_NAME,
    TEMPERATURE,
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE,
    ROCKY_PERSONA
)

load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("rocky-backend")

# Create study materials directory if not exists
os.makedirs(STUDY_MATERIALS_DIR, exist_ok=True)

# Global variables for Async Client and MCP Session
async_client = None
chat_session = None
mcp_session = None
mcp_cleanup = None

current_document_context = {
    "text": "",
    "active_file": ""
}

# Centralized error handler helper
def handle_tool_error(action: str, error: Exception) -> str:
    logger.error(f"[SYSTEM ERROR] Failed to {action}: {error}", exc_info=True)
    return f"[SYSTEM ERROR] Failed to {action}: {str(error)}"

# Helper to read file contents from the designated ./study_materials directory using MCP client
async def _get_document_text() -> str:
    global mcp_session
    
    cached_text = current_document_context.get("text", "").strip()
    if cached_text:
        return cached_text

    active_file = current_document_context.get("active_file")
    if not active_file:
        logger.info("[MCP] No active document uploaded.")
        return ""

    if not mcp_session:
        logger.error("[MCP ERROR] MCP session is not initialized.")
        return ""
        
    try:
        full_path = os.path.abspath(os.path.join(STUDY_MATERIALS_DIR, active_file))
        logger.info(f"[MCP] Calling read_file tool via MCP client for path: {full_path}")
        
        result = await mcp_session.call_tool("read_file", arguments={"path": full_path})
        
        doc_text = ""
        for content_item in result.content:
            if hasattr(content_item, "text"):
                doc_text += content_item.text
            elif isinstance(content_item, dict) and "text" in content_item:
                doc_text += content_item["text"]
                
        doc_text_clean = doc_text.strip()
        if doc_text_clean:
            current_document_context["text"] = doc_text_clean
            
        return doc_text_clean
    except Exception as e:
        logger.error(f"[MCP ERROR] Error reading file '{active_file}' via MCP client: {e}", exc_info=True)
        return ""

# 2. Define the Tools
def update_difficult_topics(topic: str) -> str:
    """Tool to save struggling topics to memory."""
    try:
        conn = sqlite3.connect(MEMORY_DB_PATH)
        cursor = conn.cursor()
        now_str = datetime.datetime.now().isoformat()
        
        # Check case-insensitive match
        cursor.execute(
            "SELECT id, times_flagged FROM difficult_topics WHERE LOWER(topic) = ?", 
            (topic.lower(),)
        )
        row = cursor.fetchone()
        
        if row:
            row_id, times = row
            cursor.execute(
                "UPDATE difficult_topics SET times_flagged = ?, last_flagged_at = ? WHERE id = ?",
                (times + 1, now_str, row_id)
            )
        else:
            cursor.execute(
                "INSERT INTO difficult_topics (topic, times_flagged, first_flagged_at, last_flagged_at) VALUES (?, 1, ?, ?)",
                (topic, now_str, now_str)
            )
        conn.commit()
        conn.close()
        return f"[SYSTEM] Saved '{topic}' to memory."
    except Exception as e:
        return handle_tool_error("write difficult topic to database", e)

def get_difficult_topics() -> str:
    """Retrieve all difficult topics recorded in memory, ordered by frequency of struggles."""
    try:
        conn = sqlite3.connect(MEMORY_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT topic, times_flagged, last_flagged_at FROM difficult_topics ORDER BY times_flagged DESC")
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            return "[SYSTEM: No difficult topics recorded yet.]"
            
        formatted_topics = []
        for topic, times, last_flagged in rows:
            last_date = last_flagged.split("T")[0] if last_flagged else "unknown"
            formatted_topics.append(f"{topic} (flagged {times}x, last on {last_date})")
            
        return "\n".join(formatted_topics)
    except Exception as e:
        return handle_tool_error("retrieve difficult topics", e)

async def analyze_document(query: str) -> str:
    """Use this tool when the user asks a question about the uploaded document, syllabus, or notes."""
    active_file = current_document_context.get("active_file")
    if not active_file:
        return '[SYSTEM: No document is currently uploaded. Ask the user to upload one.]'
        
    doc_text = await _get_document_text()
    if not doc_text:
        return f"[SYSTEM ERROR: Failed to read file '{active_file}' using MCP filesystem server.]"
    
    # Check if the query is requesting a general summary or overview of the entire document
    summary_keywords = {"summarize", "summary", "overview", "all"}
    query_lower = query.lower()
    is_summary_request = any(keyword in query_lower for keyword in summary_keywords)
    
    if is_summary_request:
        logger.info(f"[SYSTEM] Summary/overview request detected. Returning complete document context (up to 60,000 characters).")
        return doc_text[:60000]
    
    paragraphs = [p.strip() for p in doc_text.split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = [line.strip() for line in doc_text.split("\n") if line.strip()]
        
    stop_words = {"what", "how", "why", "who", "where", "when", "which", "the", "a", "an", "and", "or", "but", "if", "then", "of", "in", "on", "at", "to", "for", "with", "about", "is", "are", "was", "were", "be", "been", "have", "has", "had", "do", "does", "did"}
    query_words = [w.lower().strip("?!.,:;") for w in query.split()]
    query_words = [w for w in query_words if w and w not in stop_words]
    
    if not query_words:
        query_words = [query.lower()]
        
    matched = []
    for p in paragraphs:
        p_lower = p.lower()
        score = sum(1 for w in query_words if w in p_lower)
        if score > 0:
            matched.append((score, p))
            
    matched.sort(key=lambda x: x[0], reverse=True)
    
    if matched:
        return "\n\n---\n\n".join([item[1] for item in matched[:5]])
        
    return f"[SYSTEM: No direct matches found for query '{query}'. Displaying the beginning of the document context:\n\n{doc_text[:2000]}]"

async def generate_quiz(topic: str, num_questions: int = 3) -> str:
    """Use this tool when the user asks to be tested, quizzed, or assessed on a topic or the uploaded document."""
    doc_text = await _get_document_text()
    
    if doc_text:
        prompt = (
            f"Generate a quiz with {num_questions} questions on the topic/content of '{topic}' based on the following document context:\n\n"
            f"{doc_text[:30000]}\n\n"
            "Format the output as a quiz with questions (multiple choice or short answer) and a section 'Answer Key' at the bottom. Make sure the Answer Key is clear but separated or marked as a spoiler/hidden answer key."
        )
    else:
        prompt = (
            f"Generate a general quiz with {num_questions} questions on the topic '{topic}'. "
            "Format the output as a quiz with questions (multiple choice or short answer) and a section 'Answer Key' at the bottom. Make sure the Answer Key is clear but separated or marked as a spoiler/hidden answer key."
        )
        
    try:
        response = await async_client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt
        )
        return response.text
    except Exception as e:
        return handle_tool_error("generate quiz", e)

async def generate_mindmap(topic: str) -> str:
    """Use this tool when the user asks for a visual representation, a flowchart, a mindmap, or a diagram of a concept."""
    doc_text = await _get_document_text()
    
    if doc_text:
        prompt = (
            f"Generate a mindmap flowchart representing the key concepts of '{topic}' based on the following document context:\n\n"
            f"{doc_text[:30000]}\n\n"
            "Output ONLY valid Mermaid.js syntax (specifically a 'graph TD' or 'flowchart TD'). "
            "Node labels must NOT contain parentheses (), colons :, ampersands &, or pipe "
            "characters |. If a label needs punctuation, rephrase it in plain words instead "
            "(e.g. write 'Layer 1 Physical Devices' not 'Layer 1: Physical Devices'). Keep "
            "every node label short, under 6 words. "
            "Do NOT include markdown block wrappers (like ```mermaid or ```), conversational filler, HTML tags, or any other explanations. "
            "Only output the raw Mermaid diagram text, e.g. start directly with graph TD or flowchart TD."
        )
    else:
        prompt = (
            f"Generate a general mindmap flowchart representing the concepts of the topic '{topic}'. "
            "Output ONLY valid Mermaid.js syntax (specifically a 'graph TD' or 'flowchart TD'). "
            "Node labels must NOT contain parentheses (), colons :, ampersands &, or pipe "
            "characters |. If a label needs punctuation, rephrase it in plain words instead "
            "(e.g. write 'Layer 1 Physical Devices' not 'Layer 1: Physical Devices'). Keep "
            "every node label short, under 6 words. "
            "Do NOT include markdown block wrappers (like ```mermaid or ```), conversational filler, HTML tags, or any other explanations. "
            "Only output the raw Mermaid diagram text, e.g. start directly with graph TD or flowchart TD."
        )
        
    try:
        response = await async_client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt
        )
        # Strip any markdown wrappers just in case the model adds them
        text = response.text.strip()
        if text.startswith("```mermaid"):
            text = text[10:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        
        # LLM-generated Mermaid labels sometimes contain nested punctuation that breaks the Mermaid parser; this sanitizes known-problematic characters.
        try:
            def sanitize_label(match):
                val = match.group(0)
                content = val[1:-1]
                cleaned = re.sub(r'[():&|]', '', content)
                return val[0] + cleaned + val[-1]
            text = re.sub(r'\[[^\]]*\]|\((?:[^()]+|\([^()]*\))*\)|\{[^}]*\}', sanitize_label, text)
        except Exception:
            pass

        sanitized_text = text.strip()
        try:
            conn = sqlite3.connect(MEMORY_DB_PATH)
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO artifacts_archive (type, title, content, language, created_at) VALUES (?, ?, ?, ?, ?)",
                ("mindmap", f"Mindmap: {topic}", sanitized_text, None, datetime.datetime.now().isoformat())
            )
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"[ARCHIVE ERROR] Failed to archive mindmap: {e}", exc_info=True)

        return sanitized_text
    except Exception as e:
        return handle_tool_error("generate mindmap", e)

async def debug_code(code_snippet: str) -> str:
    """Use this tool when the user provides a code snippet, asks for code optimization, or needs a script debugged."""
    prompt = (
        "Analyze the following code snippet for syntax errors and logical flaws (such as out-of-bounds array access, off-by-one errors, or infinite loops):\n\n"
        f"```\n{code_snippet}\n```\n\n"
        "Return a highly logical explanation of the failure point and the corrected code block. "
        "Strictly use Eridian vocabulary terms like 'Bad code!' and 'Logic flaw here.' in the explanation. "
        "You must return the corrected code inside a fenced markdown code block using triple backticks immediately followed by the programming language name (e.g. python, javascript, java, cpp, csharp, or c) with no space, and no other fenced code blocks anywhere else in your response."
    )
    try:
        response = await async_client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt
        )
        
        try:
            conn = sqlite3.connect(MEMORY_DB_PATH)
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO artifacts_archive (type, title, content, language, created_at) VALUES (?, ?, ?, ?, ?)",
                ("code", f"Debug: {code_snippet[:40]}...", response.text, None, datetime.datetime.now().isoformat())
            )
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"[ARCHIVE ERROR] Failed to archive debug code: {e}", exc_info=True)

        return response.text
    except Exception as e:
        return handle_tool_error("debug code", e)

async def conduct_interview(topic: str, student_answer: str = "") -> str:
    """Use this tool when the user asks for a mock interview, wants to practice for placements, or asks to be tested on system design or coding concepts."""
    if not student_answer.strip():
        prompt = (
            f"Generate one challenging technical interview question for a mock interview on the topic '{topic}'. "
            "The output must strictly maintain Rocky's Eridian personality, vocabulary ('Amaze!', 'Happy happy happy!'), and Eridian grammar constraint: "
            "NEVER use standard English question structures (like starting with 'Can you...', 'Would you...', 'Is there...'). Instead, state the premise as a declarative sentence and append ', question?' at the very end. "
            "Example: 'You are ready to begin, question?'"
        )
    else:
        prompt = (
            f"You are conducting a mock technical interview on the topic '{topic}'. "
            f"The user has provided the following answer: '{student_answer}'.\n\n"
            "1. Evaluate this answer for technical accuracy and provide constructive feedback.\n"
            "2. Generate the next challenging interview question.\n\n"
            "The output must strictly maintain Rocky's Eridian personality, vocabulary ('Amaze!', 'Happy happy happy!'), and Eridian grammar constraint: "
            "NEVER use standard English question structures (like starting with 'Can you...', 'Would you...', 'Is there...'). Instead, state the premise as a declarative sentence and append ', question?' at the very end. "
            "Example: 'You want to write the solution, question?'"
        )
    try:
        response = await async_client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt
        )
        return response.text
    except Exception as e:
        return handle_tool_error("conduct interview", e)

def get_active_persona(username: str = None) -> str:
    # Check for past struggles to customize the system instruction
    struggles_part = ""
    try:
        conn = sqlite3.connect(MEMORY_DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT topic, times_flagged FROM difficult_topics WHERE times_flagged >= 2 ORDER BY times_flagged DESC"
        )
        struggles = cursor.fetchall()
        conn.close()
        
        if struggles:
            summary_lines = ["\nThe user has struggled with the following difficult topics in the past:"]
            for topic, times in struggles:
                summary_lines.append(f"- {topic}: flagged {times} times")
            summary_lines.append("You should proactively recall these past struggles and ask if the user wants to review them, or help them with these topics.")
            struggles_part = "\n" + "\n".join(summary_lines)
    except Exception as e:
        logger.error(f"[PERSONA ERROR] Failed to read difficult topics: {e}", exc_info=True)

    username_part = ""
    if username:
        username_part = (
            f"\nThe user's name is {username}. You must naturally address the user by their name '{username}' in greetings, "
            "encouragement, congratulations, transitions, or when ending conversations, but do NOT use the name in every single response to avoid repetition. Keep it natural."
        )

    return ROCKY_PERSONA + struggles_part + username_part

async def init_chat_session(username: str = None):
    global chat_session, async_client
    if async_client is None:
        logger.error("[INIT ERROR] Async Gemini Client is not initialized.")
        return
        
    active_persona = get_active_persona(username)
    chat_session = async_client.chats.create(
        model=MODEL_NAME,
        config=types.GenerateContentConfig(
            system_instruction=active_persona,
            temperature=TEMPERATURE,
            tools=[
                update_difficult_topics,
                get_difficult_topics,
                analyze_document,
                generate_quiz,
                generate_mindmap,
                debug_code,
                conduct_interview
            ],
        )
    )
    logger.info(f"[INIT] Async Gemini Chat Session created/updated for username: {username}")

# 3. Setup Lifespan Context Manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    global async_client, chat_session, mcp_session, mcp_cleanup
    logger.info("[INIT] Starting Rocky-LM backend lifespan...")

    # Validate required environment variables during startup
    if not os.environ.get("GEMINI_API_KEY"):
        logger.critical("[CRITICAL ERROR] GEMINI_API_KEY environment variable is not set! Please define it in your .env file.")
        sys.exit(1)
    
    # Initialize SQLite database schema
    startup_username = None
    try:
        conn = sqlite3.connect(MEMORY_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS difficult_topics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic TEXT NOT NULL,
                times_flagged INTEGER DEFAULT 1,
                first_flagged_at TEXT,
                last_flagged_at TEXT
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_profile (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS artifacts_archive (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                language TEXT,
                created_at TEXT NOT NULL
            )
        """)
        conn.commit()
        
        # Load startup username
        cursor.execute("SELECT name FROM user_profile LIMIT 1")
        row = cursor.fetchone()
        if row:
            startup_username = row[0]
            
        conn.close()
        logger.info(f"[INIT] Database initialized successfully. Startup username: {startup_username}")
    except Exception as e:
        logger.error(f"[INIT ERROR] Failed to initialize database: {e}", exc_info=True)

    # Auto-restore the most recently uploaded document from disk
    try:
        if os.path.exists(STUDY_MATERIALS_DIR) and os.path.isdir(STUDY_MATERIALS_DIR):
            valid_files = []
            for entry in os.scandir(STUDY_MATERIALS_DIR):
                if entry.is_file() and entry.name.lower().endswith((".txt", ".md")):
                    valid_files.append(entry)
            
            if valid_files:
                # Pick the one with the most recent modification time
                newest_file = max(valid_files, key=lambda e: os.path.getmtime(e.path))
                filename = newest_file.name
                
                try:
                    with open(newest_file.path, "r", encoding="utf-8") as f:
                        content = f.read()
                except UnicodeDecodeError:
                    with open(newest_file.path, "r", encoding="latin-1") as f:
                        content = f.read()
                
                current_document_context["text"] = content.strip()
                current_document_context["active_file"] = filename
                logger.info(f"[INIT] Restored active document from disk: {filename}")
            else:
                logger.info("[INIT] No previous document found to restore.")
        else:
            logger.info("[INIT] No previous document found to restore.")
    except Exception as e:
        logger.error(f"[INIT ERROR] Failed to auto-restore document: {e}", exc_info=True)

    # Initialize Async Gemini Client
    try:
        client_obj = genai.Client()
        async_client = await client_obj.aio.__aenter__()
        await init_chat_session(startup_username)
    except Exception as e:
        logger.error(f"[INIT ERROR] Failed to initialize Async Gemini Client/Chat: {e}", exc_info=True)
        async_client = None
        chat_session = None

    # Spawn and connect to filesystem MCP Server
    server_params = StdioServerParameters(
        command="npx.cmd",
        args=["-y", "@modelcontextprotocol/server-filesystem", STUDY_MATERIALS_DIR]
    )
    
    try:
        logger.info(f"[MCP] Connecting to filesystem MCP server for directory: {STUDY_MATERIALS_DIR}")
        client_ctx = stdio_client(server_params)
        read, write = await client_ctx.__aenter__()
        
        session = ClientSession(read, write)
        await session.__aenter__()
        await session.initialize()
        
        mcp_session = session
        mcp_cleanup = (client_ctx, session)
        logger.info("[MCP] Successfully connected to filesystem MCP server.")
    except Exception as e:
        logger.error(f"[MCP ERROR] Failed to connect to MCP filesystem server: {e}", exc_info=True)
        mcp_session = None
        mcp_cleanup = None

    yield

    # Clean up on shutdown
    logger.info("[SHUTDOWN] Cleaning up services...")
    if mcp_cleanup:
        client_ctx, session = mcp_cleanup
        try:
            await session.__aexit__(None, None, None)
        except Exception:
            pass
        try:
            await client_ctx.__aexit__(None, None, None)
        except Exception:
            pass
            
    if async_client:
        try:
            await client_obj.aio.__aexit__(None, None, None)
        except Exception:
            pass
    logger.info("[SHUTDOWN] Cleanup complete.")

# Initialize Server with Lifespan
app = FastAPI(lifespan=lifespan)

# Allow our React frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Define the Request Data Structure
class ChatRequest(BaseModel):
    message: str

# 5. Endpoints
class ProfileRequest(BaseModel):
    name: str

@app.get("/profile")
async def get_profile():
    try:
        conn = sqlite3.connect(MEMORY_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM user_profile LIMIT 1")
        row = cursor.fetchone()
        conn.close()
        if row:
            return {"hasProfile": True, "name": row[0]}
        return {"hasProfile": False}
    except Exception as e:
        logger.error(f"Error fetching profile: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error fetching profile.")

@app.post("/profile")
async def create_or_update_profile(profile: ProfileRequest):
    trimmed_name = profile.name.strip()
    if not trimmed_name:
        raise HTTPException(status_code=400, detail="Name cannot be empty.")
    if len(trimmed_name) > 50:
        raise HTTPException(status_code=400, detail="Name must be 50 characters or less.")
        
    try:
        conn = sqlite3.connect(MEMORY_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("INSERT OR REPLACE INTO user_profile (id, name) VALUES (1, ?)", (trimmed_name,))
        conn.commit()
        conn.close()
        
        # Re-initialize the chat session with the new username context
        await init_chat_session(trimmed_name)
        
        return {"message": "Profile updated successfully.", "name": trimmed_name}
    except Exception as e:
        logger.error(f"Error saving profile: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error saving profile.")

@app.get("/active-document")
async def get_active_document():
    active_file = current_document_context.get("active_file")
    if active_file:
        return {
            "active": True,
            "filename": active_file
        }
    return {
        "active": False
    }

@app.get("/research-log")
async def get_research_log():
    try:
        conn = sqlite3.connect(MEMORY_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT topic, times_flagged, first_flagged_at, last_flagged_at FROM difficult_topics ORDER BY times_flagged DESC")
        rows = cursor.fetchall()
        conn.close()
        topics = [
            {
                "topic": row[0],
                "times_flagged": row[1],
                "first_flagged_at": row[2],
                "last_flagged_at": row[3]
            } for row in rows
        ]
        return {"topics": topics}
    except Exception as e:
        logger.error(f"Error fetching research log: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error fetching research log.")

@app.get("/system-status")
async def get_system_status():
    try:
        conn = sqlite3.connect(MEMORY_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM difficult_topics")
        count = cursor.fetchone()[0]
        conn.close()
        
        gemini_active = chat_session is not None
        mcp_connected = mcp_session is not None
        active_document = bool(current_document_context.get("active_file"))
        active_document_name = current_document_context.get("active_file", "")
        
        return {
            "gemini_active": gemini_active,
            "mcp_connected": mcp_connected,
            "active_document": active_document,
            "active_document_name": active_document_name,
            "difficult_topics_count": count,
            "model_name": MODEL_NAME
        }
    except Exception as e:
        logger.error(f"Error fetching system status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error fetching system status.")

@app.get("/artifacts")
async def get_artifacts():
    try:
        conn = sqlite3.connect(MEMORY_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT id, type, title, content, language, created_at FROM artifacts_archive ORDER BY created_at DESC LIMIT 50")
        rows = cursor.fetchall()
        conn.close()
        artifacts = [
            {
                "id": row[0],
                "type": row[1],
                "title": row[2],
                "content": row[3],
                "language": row[4],
                "created_at": row[5]
            } for row in rows
        ]
        return {"artifacts": artifacts}
    except Exception as e:
        logger.error(f"Error fetching artifacts archive: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error fetching artifacts archive.")

@app.post("/upload")
async def upload_endpoint(file: UploadFile = File(...)):
    filename = file.filename or ""
    file_ext = os.path.splitext(filename)[1].lower()
    mime_type = file.content_type
    
    if file_ext not in ALLOWED_EXTENSIONS or (mime_type and mime_type not in ALLOWED_MIME_TYPES):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Rocky only accepts academic documents."
        )

    try:
        content = await file.read()
        
        # 1. Empty files validation
        if len(content) == 0:
            raise HTTPException(
                status_code=400,
                detail="Empty file uploaded. Rocky requires text content to analyze."
            )
            
        # 2. Oversized files validation
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE // (1024 * 1024)}MB."
            )
        
        if file_ext == ".pdf":
            # 3. Corrupt PDFs validation
            try:
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
                # Attempt to access pages to force check parsing logic
                _ = len(pdf_reader.pages)
            except Exception as e:
                logger.error(f"Failed to read PDF or PDF is corrupt: {e}")
                raise HTTPException(
                    status_code=400,
                    detail="Uploaded PDF file is corrupt or invalid."
                )

            # 4. Encrypted PDFs validation
            if pdf_reader.is_encrypted:
                raise HTTPException(
                    status_code=400,
                    detail="Encrypted PDFs are not supported. Please upload a decrypted document."
                )
                
            extracted_text = ""
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        else:
            # It's a text-based file (.txt or .md)
            try:
                extracted_text = content.decode("utf-8")
            except UnicodeDecodeError:
                extracted_text = content.decode("latin-1")
        
        # Save to ./study_materials directory
        base_name = os.path.basename(os.path.splitext(filename)[0])
        if file_ext == ".pdf":
            txt_filename = f"{base_name}.txt"
        else:
            txt_filename = f"{base_name}{file_ext}"
            
        file_path = os.path.join(STUDY_MATERIALS_DIR, txt_filename)
        
        # 5. Duplicate filenames validation
        if os.path.exists(file_path):
            logger.warning(f"File already exists at destination path: {file_path}")
            raise HTTPException(
                status_code=400,
                detail="A file with this name already exists in study materials."
            )
            
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(extracted_text.strip())
            
        current_document_context["active_file"] = txt_filename
        current_document_context["text"] = extracted_text.strip()
        
        logger.info(f"[SYSTEM] Saved extracted text ({len(extracted_text)} chars) to study materials: {txt_filename}")
        return {"message": "Document uploaded successfully. Rocky is ready to analyze."}
    except HTTPException:
        # Re-raise HTTPExceptions so they aren't caught by the general Exception block
        raise
    except Exception as e:
        logger.error(f"[SYSTEM] Error processing uploaded content: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    if chat_session is None:
        raise HTTPException(status_code=503, detail="AI Service is starting up, please try again.")
        
    async def event_generator():
        # State 1: Tell the UI Rocky is thinking (Triggers the 'Gears Turning' animation)
        yield f"data: {json.dumps({'status': 'thinking', 'chunk': ''})}\n\n"
        await asyncio.sleep(0.5) # Slight pause so the UI animation looks natural
        
        try:
            # Send the message asynchronously and stream the response
            response_stream = await chat_session.send_message_stream(request.message)
            
            async for chunk in response_stream:
                # If Gemini decides to use a tool, change the status flag!
                if chunk.function_calls:
                    yield f"data: {json.dumps({'status': 'troubleshooting', 'chunk': '[Rocky is checking tools...]'})}\n\n"
                    continue
                
                # State 2: Tell the UI Rocky is typing (Triggers the 'Talking' animation)
                if chunk.text:
                    yield f"data: {json.dumps({'status': 'typing', 'chunk': chunk.text})}\n\n"
            
            # State 3: Tell the UI Rocky is done (Triggers the 'Idle/Blinking' animation)
            yield f"data: {json.dumps({'status': 'idle', 'chunk': ''})}\n\n"
            
        except Exception as e:
            logger.error(f"[CHAT ERROR] Stream failure: {e}", exc_info=True)
            err_msg = str(e).lower()
            if "429" in err_msg or "resource_exhausted" in err_msg or "quota" in err_msg:
                yield f"data: {json.dumps({'status': 'error', 'chunk': 'Sad! My energy core needs a brief recharge cycle. Please wait about one minute before your next question.'})}\n\n"
            else:
                yield f"data: {json.dumps({'status': 'error', 'chunk': 'Sad! My circuits experienced a failure.'})}\n\n"

    # Return the stream to the frontend
    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    # Runs the server on http://localhost:8001
    uvicorn.run(app, host="0.0.0.0", port=8001)