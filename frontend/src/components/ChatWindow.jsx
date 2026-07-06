import React, { useState } from 'react';
import ChatMessage from './ChatMessage';
import RockyMascot from './RockyMascot';
import QuickActions from './QuickActions';
import ChatInput from './ChatInput';

export default function ChatWindow({
  showArtifacts,
  messages,
  rockyState,
  artifact,
  setArtifact,
  setShowArtifacts,
  extractArtifact,
  messagesEndRef,
  quickActions,
  handleQuickAction,
  input,
  setInput,
  sendMessage,
  handleFileUpload,
  isUploading,
  fileInputRef,
  chatInputRef,
  activeDocument = { active: false, filename: '' }
}) {
  const [isBannerMinimized, setIsBannerMinimized] = useState(() => {
    return localStorage.getItem('banner-minimized') === 'true';
  });

  const toggleBanner = () => {
    const nextState = !isBannerMinimized;
    setIsBannerMinimized(nextState);
    localStorage.setItem('banner-minimized', String(nextState));
  };

  const latestRockyIndex = [...messages].reverse().findIndex(m => m.role === 'rocky');
  const actualLatestRockyIndex = latestRockyIndex !== -1 ? messages.length - 1 - latestRockyIndex : -1;

  // Auto-scroll to the bottom of the chat window
  React.useEffect(() => {
    const messagesContainer = document.querySelector('.chat-space');
    if (messagesContainer) {
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, rockyState]);

  // Smooth entry animation class adder
  React.useEffect(() => {
    const messageElements = document.querySelectorAll('.chat-message');
    messageElements.forEach(el => {
      requestAnimationFrame(() => {
        el.classList.add('visible');
      });
    });
  }, [messages]);

  return (
    <div className={`w-full ${showArtifacts ? 'lg:w-[60%]' : 'lg:w-full'} flex flex-col border-b lg:border-b-0 lg:border-r border-outline-variant/20 p-3 sm:p-4 justify-between overflow-hidden transition-all duration-300 ease-in-out`}>
      {/* Active Study Material Banner */}
      {activeDocument.active ? (
        isBannerMinimized ? (
          <div className="bg-basalt/50 backdrop-blur-sm border border-magma/30 rounded-xl px-4 py-2 mb-3 shadow-md flex justify-between items-center font-sans text-xs text-on-surface transition-all duration-300">
            <div className="flex items-center space-x-2">
              <span>📚</span>
              <span className="font-heading font-bold text-magma">Active Study Material:</span>
              <span className="text-xenonite font-mono font-bold">{activeDocument.filename}</span>
            </div>
            <button
              onClick={toggleBanner}
              type="button"
              className="text-on-surface-variant hover:text-magma px-2.5 py-1 rounded hover:bg-surface-container-high font-mono font-bold text-[10px] cursor-pointer transition-all duration-200"
            >
              [Expand]
            </button>
          </div>
        ) : (
          <div className="bg-basalt/50 backdrop-blur-sm border border-magma/40 rounded-xl p-4 mb-3 shadow-lg transition-all duration-300 font-sans text-xs text-on-surface hover:border-magma/60 relative">
            <button
              onClick={toggleBanner}
              type="button"
              className="absolute top-4 right-4 text-on-surface-variant hover:text-magma px-2 py-0.5 rounded hover:bg-surface-container-high font-mono font-bold text-[10px] cursor-pointer transition-all duration-200"
            >
              [Minimize]
            </button>
            <div className="flex items-center space-x-2 text-magma font-bold text-sm mb-1.5 font-heading">
              <span>📚</span>
              <span>Active Study Material</span>
            </div>
            <div className="flex items-center space-x-2 text-xenonite font-bold mb-2 bg-[#161311]/90 px-3 py-1.5 rounded-lg border border-outline-variant/15 max-w-max font-mono">
              <span>📄</span>
              <span>{activeDocument.filename}</span>
            </div>
            <p className="text-on-surface-variant/90 leading-relaxed font-sans">
              Rocky remembers this document across sessions and is ready to answer questions about it.
            </p>
            <p className="text-[10px] text-on-surface-variant/50 mt-1.5 font-mono">
              Upload another document anytime to replace the current study context.
            </p>
          </div>
        )
      ) : (
        <div className="bg-basalt/20 backdrop-blur-sm border border-outline-variant/15 rounded-xl p-4 mb-3 shadow-md transition-all duration-300 hover:border-magma/30">
          <div className="flex items-center space-x-2 text-on-surface font-bold text-sm mb-1.5 font-heading">
            <span className="text-lg filter drop-shadow(0 0 4px rgba(183, 93, 41, 0.4))">📂</span>
            <span>No Study Material Loaded</span>
          </div>
          <p className="text-xs text-on-surface-variant/90 leading-relaxed font-sans">
            Upload a PDF, Markdown, or Text file to begin your study session. Rocky will analyze the document and help you study.
          </p>
        </div>
      )}

      {/* Chat Space */}
      <div className="chat-space flex-1 min-h-0 bg-background border border-outline-variant/20 overflow-y-auto p-4 space-y-4 rounded-t-xl">
        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            msg={msg}
            index={index}
            rockyState={rockyState}
            actualLatestRockyIndex={actualLatestRockyIndex}
            artifact={artifact}
            setArtifact={setArtifact}
            setShowArtifacts={setShowArtifacts}
            extractArtifact={extractArtifact}
            messages={messages}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer input zone wrapping mascot + quick actions + form */}
      <div className="border-t-[3px] border-xenonite mt-5 pt-5 flex flex-col w-full">
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-5 px-2">
          {/* Mascot Status */}
          <div className="flex items-center justify-center space-x-3 py-2 bg-basalt/10 border border-outline-variant/10 rounded-xl px-4 max-w-max mx-auto shadow-sm">
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
              <RockyMascot status={rockyState} />
            </div>
            <div className="text-[10px] sm:text-xs text-on-surface-variant capitalize font-mono flex items-center">
              <span className="opacity-50">Status:&nbsp;</span>
              <span className="text-magma font-bold">{rockyState}</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <QuickActions quickActions={quickActions} handleQuickAction={handleQuickAction} />

          {/* Form Submission Panel */}
          <ChatInput
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            handleFileUpload={handleFileUpload}
            isUploading={isUploading}
            rockyState={rockyState}
            fileInputRef={fileInputRef}
            chatInputRef={chatInputRef}
          />
        </div>
      </div>
    </div>
  );
}
