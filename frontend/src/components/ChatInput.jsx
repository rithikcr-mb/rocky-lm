import React from 'react';
import { ArrowUp, Loader2, Paperclip } from 'lucide-react';

export default function ChatInput({
  input,
  setInput,
  sendMessage,
  handleFileUpload,
  isUploading,
  isSending,
  rockyState,
  fileInputRef,
  chatInputRef,
}) {
  const busy = isUploading || isSending;

  return (
    <form onSubmit={sendMessage} className="flex w-full items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e.target.files?.[0], fileInputRef)}
        accept=".pdf,.txt,.md,text/plain,text/markdown,application/pdf"
        className="hidden"
        aria-label="Upload study material"
      />
      <input
        type="text"
        ref={chatInputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        aria-label="Message Rocky"
        placeholder="Ask about your notes"
        className="h-11 min-w-0 flex-1 rounded-[10px] border border-line bg-surface px-3.5 text-sm text-ink transition-colors duration-150 ease-ease placeholder:text-ink-muted focus:border-ember/60 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={busy || (rockyState !== 'idle' && rockyState !== 'error')}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-line bg-surface text-ink-secondary transition-colors duration-150 ease-ease hover:bg-surface-raised hover:text-ink disabled:opacity-40"
        aria-label="Upload study material"
        title="Upload study material"
      >
        {isUploading ? (
          <Loader2 size={17} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
        ) : (
          <Paperclip size={17} strokeWidth={1.5} aria-hidden="true" />
        )}
      </button>
      <button
        type="submit"
        disabled={busy || !input.trim() || (rockyState !== 'idle' && rockyState !== 'error')}
        aria-busy={busy}
        aria-label="Send message"
        className="flex h-11 shrink-0 items-center gap-1.5 rounded-[10px] bg-ink px-3.5 text-sm font-medium text-background transition-colors duration-150 ease-ease hover:bg-white disabled:bg-surface-high disabled:text-ink-muted"
      >
        {isSending ? (
          <Loader2 size={16} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
        ) : (
          <ArrowUp size={16} strokeWidth={2} aria-hidden="true" />
        )}
        <span className="hidden sm:inline">Send</span>
      </button>
    </form>
  );
}
