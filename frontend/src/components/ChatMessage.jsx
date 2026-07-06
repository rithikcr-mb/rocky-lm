import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MermaidRenderer from './MermaidRenderer';

const renderers = {
  h1: ({ children }) => <h1 className="text-lg font-bold text-magma mt-4 mb-2 border-b border-outline-variant/20 pb-1.5">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-bold text-magma mt-4 mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-bold text-on-surface mt-3 mb-1.5">{children}</h3>,
  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-on-surface/90">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1.5 text-on-surface/90">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-on-surface/90">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed mb-1 last:mb-0">{children}</li>,
  a: ({ href, children }) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="text-magma hover:text-xenonite underline transition-colors"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-magma bg-background/40 pl-3 py-1 italic my-2 rounded-r text-on-surface">
      {children}
    </blockquote>
  ),
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const isMermaid = match && match[1] === 'mermaid';
    const codeString = String(children).replace(/\n$/, '');

    if (isMermaid) {
      return <MermaidRenderer chart={codeString} />;
    }

    const isInline = !match && !String(children).includes('\n');

    if (isInline) {
      return (
        <code className="bg-background border border-outline-variant/20 px-1.5 py-0.5 rounded text-magma font-mono text-xs" {...props}>
          {children}
        </code>
      );
    }

    return (
      <div className="my-3 border border-outline-variant/20 rounded-lg overflow-hidden bg-background shadow-inner font-mono text-xs">
        <div className="bg-background px-3 py-1.5 border-b border-outline-variant/20 flex justify-between items-center text-on-surface-variant">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-xenonite">{match ? match[1] : 'code'}</span>
          <span className="text-[9px] text-on-surface-variant">Code Box</span>
        </div>
        <pre className="p-3 overflow-x-auto text-on-surface leading-relaxed">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    );
  }
};

export default function ChatMessage({
  msg,
  index,
  rockyState,
  actualLatestRockyIndex,
  artifact,
  setArtifact,
  setShowArtifacts,
  extractArtifact,
  messages = []
}) {
  if (msg.role === 'system') {
    return (
      <div key={index} className="flex justify-center my-2">
        <div className="bg-surface-container-low/40 border border-outline-variant/20 text-on-surface-variant text-xs px-4 py-2 rounded-lg italic shadow-inner max-w-[90%] text-center">
          {msg.text}
        </div>
      </div>
    );
  }

  let textToShow = msg.text;
  if (msg.role === 'rocky' && rockyState !== 'thinking') {
    const extracted = extractArtifact(msg.text);
    if (extracted) {
      textToShow = extracted.remainingText;
      if (index === actualLatestRockyIndex && artifact.content !== extracted.content) {
        setArtifact({
          type: extracted.type,
          title: extracted.title,
          content: extracted.content,
          language: extracted.language || ''
        });
        setShowArtifacts(true);
      }
    }
  }

  const getLoadingDetails = () => {
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return { text: 'Processing request...', icon: '⚙️' };
    const lastText = userMessages[userMessages.length - 1].text.toLowerCase();
    
    if (lastText.includes('quiz') || lastText.includes('question')) {
      return { text: 'Forging educational quiz...', icon: '📝' };
    }
    if (lastText.includes('mindmap') || lastText.includes('concept') || lastText.includes('draw') || lastText.includes('map')) {
      return { text: 'Mapping conceptual pathways...', icon: '🗺️' };
    }
    if (lastText.includes('interview') || lastText.includes('practice')) {
      return { text: 'Preparing interview session...', icon: '👔' };
    }
    if (lastText.includes('debug') || lastText.includes('code') || lastText.includes('error') || lastText.includes('fix')) {
      return { text: 'Debugging source syntax...', icon: '🐛' };
    }
    if (lastText.includes('upload') || lastText.includes('document') || lastText.includes('pdf')) {
      return { text: 'Analyzing study materials...', icon: '📂' };
    }
    return { text: 'Processing request...', icon: '⚙️' };
  };

  const loadingDetails = getLoadingDetails();

  return (
    <div
      key={index}
      className={`chat-message chat-message-animate flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] md:max-w-[72%] p-2.5 md:p-3.5 rounded-xl text-sm shadow-md font-sans ${
          msg.role === 'user'
            ? 'bg-magma text-white rounded-br-none whitespace-pre-wrap custom-inner-shadow'
            : 'bg-basalt rounded-bl-none text-on-surface custom-inner-shadow xenonite-border'
        }`}
      >
        <div className="text-[10px] uppercase font-mono tracking-wider opacity-40 mb-1">
          {msg.role === 'user' ? 'Student' : 'Rocky'}
        </div>
        {msg.role === 'user' ? (
          <span className="font-sans leading-relaxed">{textToShow}</span>
        ) : textToShow ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers}>
            {textToShow}
          </ReactMarkdown>
        ) : (
          rockyState === 'thinking' && (
            <div className="flex flex-col space-y-2 py-1">
              <div className="flex items-center space-x-2 text-xs text-on-surface-variant font-mono">
                <span>{loadingDetails.icon}</span>
                <span>{loadingDetails.text}</span>
              </div>
              <div className="flex space-x-1.5 items-center pl-6">
                <div className="w-1.5 h-1.5 bg-xenonite rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-xenonite rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-xenonite rounded-full animate-bounce"></div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
