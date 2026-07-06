import React from 'react';

export default function ChatInput({
  input,
  setInput,
  sendMessage,
  handleFileUpload,
  isUploading,
  rockyState,
  fileInputRef,
  chatInputRef
}) {
  return (
    <form onSubmit={sendMessage} className="flex flex-nowrap items-center gap-2.5 w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e.target.files?.[0], fileInputRef)}
        accept=".pdf"
        className="hidden"
      />
      <input
        type="text"
        ref={chatInputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask a technical question or explain what you are struggling with..."
        className="chat-input flex-1 min-w-[120px] bg-[#1a1614] border border-outline-variant/20 rounded-xl px-4 h-12 text-sm focus:outline-none focus:border-[#e67e22] focus:ring-2 focus:ring-[#e67e22]/25 transition-all duration-300 custom-inner-shadow placeholder:text-on-surface-variant/50 font-mono text-on-surface placeholder:transition-opacity placeholder:duration-200 focus:placeholder:opacity-20 shadow-inner"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading || (rockyState !== 'idle' && rockyState !== 'error')}
        className="bg-basalt border border-outline-variant/20 hover:bg-surface-container-high hover:text-[#e67e22] hover:scale-105 active:scale-95 disabled:bg-background disabled:scale-100 text-on-surface font-bold px-4 h-12 rounded-xl text-sm transition-all duration-200 shadow-md flex items-center justify-center cursor-pointer shrink-0"
      >
        {isUploading ? '⌛' : '📎'}
      </button>
      <button
        type="submit"
        disabled={isUploading || (rockyState !== 'idle' && rockyState !== 'error')}
        className="bg-[#e67e22] hover:bg-[#d35400] hover:shadow-lg hover:shadow-[#e67e22]/25 hover:-translate-y-0.5 hover:scale-105 active:scale-95 disabled:bg-outline-variant/20 disabled:scale-100 disabled:opacity-50 text-white font-bold px-4 sm:px-6 h-12 rounded-xl text-sm transition-all duration-200 shadow-md cursor-pointer flex items-center justify-center shrink-0"
      >
        Transmit
      </button>
    </form>
  );
}
