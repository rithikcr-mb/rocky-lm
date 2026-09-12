import { useState, useEffect, useRef } from 'react';
import { fetchChatStream, uploadFile, fetchActiveDocument, fetchProfile } from '../services/api';

export default function useChat() {
  const [messages, setMessages] = useState([
    { role: 'rocky', text: 'Amaze! Systems online. Ready for academic mission.' }
  ]);
  const [input, setInput] = useState('');
  const [rockyState, setRockyState] = useState('idle'); // idle, thinking, typing, troubleshooting
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeDocument, setActiveDocument] = useState({ active: false, filename: '' });
  const [profile, setProfile] = useState({ hasProfile: false, name: '' });
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const getActiveDoc = async () => {
      try {
        const data = await fetchActiveDocument();
        if (isMounted.current) {
          setActiveDocument(data);
        }
      } catch (err) {
        console.error('Error fetching active document on start:', err);
      }
    };
    const getProfileData = async () => {
      try {
        const data = await fetchProfile();
        if (isMounted.current) {
          setProfile(data);
        }
      } catch (err) {
        console.error('Error fetching profile on start:', err);
      }
    };
    getActiveDoc();
    getProfileData();
  }, []);

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isSending) return;

    const userMessage = input.trim();
    setInput('');
    setIsSending(true);
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setRockyState('thinking');

    // Add a placeholder message for Rocky that we will update in real-time
    setMessages((prev) => [...prev, { role: 'rocky', text: '' }]);

    try {
      const response = await fetchChatStream(userMessage);

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const errorDetail = payload.detail || 'Streaming error';
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], text: `Error: ${errorDetail}` };
          return updated;
        });
        return;
      }

      if (!response.body) {
        throw new Error('The chat service returned an empty response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentText = '';
      let pendingData = '';

      while (true) {
        const { value, done } = await reader.read();
        pendingData += decoder.decode(value || new Uint8Array(), { stream: !done });
        const events = pendingData.split('\n\n');
        pendingData = events.pop() || '';

        for (const event of events) {
          const line = event.split('\n').find((entry) => entry.startsWith('data: '));
          if (!line) continue;
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              // Update the character state based on the backend signal
              if (data.status) {
                if (isMounted.current) {
                  setRockyState(data.status);
                }
              }

              // If text content is arriving, append it to Rocky's latest message
              if (data.chunk) {
                currentText += data.chunk;
                setMessages((prev) => {
                  if (!isMounted.current) return prev;
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...updated[updated.length - 1], text: currentText };
                  return updated;
                });
              }
            } catch (err) {
              console.warn('Ignored malformed chat stream event.', err);
            }
          }
        }

        if (done) break;
      }
    } catch (error) {
      if (isMounted.current) {
        console.error('Error streaming chat:', error);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], text: 'Error: Unable to reach Rocky. Please try again.' };
          return updated;
        });
      }
    } finally {
      if (isMounted.current) {
        setRockyState('idle');
        setIsSending(false);
      }
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
    isSending,
    sendMessage,
    handleFileUpload,
    activeDocument,
    setActiveDocument,
    profile,
    setProfile
  };
}
