import { useState, useEffect } from 'react';
import { fetchChatStream, uploadFile, fetchActiveDocument, fetchProfile } from '../services/api';

export default function useChat() {
  const [messages, setMessages] = useState([
    { role: 'rocky', text: 'Amaze! Systems online. Ready for academic mission.' }
  ]);
  const [input, setInput] = useState('');
  const [rockyState, setRockyState] = useState('idle'); // idle, thinking, typing, troubleshooting
  const [isUploading, setIsUploading] = useState(false);
  const [activeDocument, setActiveDocument] = useState({ active: false, filename: '' });
  const [profile, setProfile] = useState({ hasProfile: false, name: '' });

  useEffect(() => {
    const getActiveDoc = async () => {
      try {
        const data = await fetchActiveDocument();
        setActiveDocument(data);
      } catch (err) {
        console.error('Error fetching active document on start:', err);
      }
    };
    const getProfileData = async () => {
      try {
        const data = await fetchProfile();
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile on start:', err);
      }
    };
    getActiveDoc();
    getProfileData();
  }, []);

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setRockyState('thinking');

    // Add a placeholder message for Rocky that we will update in real-time
    setMessages((prev) => [...prev, { role: 'rocky', text: '' }]);

    try {
      const response = await fetchChatStream(userMessage);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Chunks arrive as byte arrays, decode them to text strings
        const chunkText = decoder.decode(value);
        const lines = chunkText.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              // Update the character state based on the backend signal
              if (data.status) {
                setRockyState(data.status);
              }

              // If text content is arriving, append it to Rocky's latest message
              if (data.chunk) {
                currentText += data.chunk;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1].text = currentText;
                  return updated;
                });
              }
            } catch (err) {
              // Ignore partial or malformed JSON chunks during streaming splits
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming chat:', error);
      setRockyState('idle');
    }
  };

  const handleFileUpload = async (file, fileInputRef) => {
    if (!file) return;

    setIsUploading(true);

    try {
      const response = await uploadFile(file);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      setMessages((prev) => [
        ...prev,
        { role: 'system', text: '[System: Document uploaded successfully. Rocky is ready to analyze.]' }
      ]);
      
      const data = await fetchActiveDocument();
      setActiveDocument(data);
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'system', text: '[System: Upload failed. Please try again.]' }
      ]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return {
    messages,
    setMessages,
    input,
    setInput,
    rockyState,
    setRockyState,
    isUploading,
    setIsUploading,
    sendMessage,
    handleFileUpload,
    activeDocument,
    setActiveDocument,
    profile,
    setProfile
  };
}
