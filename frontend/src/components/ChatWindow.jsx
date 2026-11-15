import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Upload } from 'lucide-react';
import ChatMessage from './ChatMessage';
import RockyMascot from './RockyMascot';
import QuickActions from './QuickActions';
import ChatInput from './ChatInput';

const stateLabels = {
  idle: 'Ready',
  thinking: 'Thinking',
  typing: 'Writing',
  troubleshooting: 'Checking notes',
  error: 'Error',
};

function fileType(filename = '') {
  const extension = filename.split('.').pop();
  return extension && extension !== filename ? extension.toUpperCase() : 'FILE';
}

export default function ChatWindow({
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
  isSending,
  fileInputRef,
  chatInputRef,
  activeDocument = { active: false, filename: '' },
}) {
  const [isBannerMinimized, setIsBannerMinimized] = useState(() => {
    return localStorage.getItem('banner-minimized') === 'true';
  });

  const toggleBanner = () => {
    const nextState = !isBannerMinimized;
    setIsBannerMinimized(nextState);
    localStorage.setItem('banner-minimized', String(nextState));
  };

  const latestRockyIndex = [...messages].reverse().findIndex((m) => m.role === 'rocky');
  const actualLatestRockyIndex =
    latestRockyIndex !== -1 ? messages.length - 1 - latestRockyIndex : -1;

  React.useEffect(() => {
    const messagesContainer = document.querySelector('.chat-space');
    if (messagesContainer) {
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, rockyState]);

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-4 md:px-6 md:pt-5">
        {activeDocument.active ? (
          isBannerMinimized ? (
            <div className="mx-auto flex h-10 w-full max-w-[860px] items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3">
              <div className="flex min-w-0 items-center gap-2">
                <FileText size={16} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-hidden="true" />
                <span className="shrink-0 text-[12px] text-ink-muted">Study material</span>
                <span className="truncate font-mono text-[12px] text-ink">{activeDocument.filename}</span>
              </div>
              <button
                type="button"
                onClick={toggleBanner}
                className="flex h-7 items-center gap-1 rounded-md px-1.5 text-[11px] text-ink-muted transition-colors duration-150 ease-ease hover:bg-surface-raised hover:text-ink"
                aria-label="Expand study material"
              >
                <ChevronDown size={14} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-[860px] rounded-xl border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <FileText size={18} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-mono text-[12px] text-ink">{activeDocument.filename}</span>
                      <span className="shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[11px] text-ink-muted">
                        {fileType(activeDocument.filename)}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] text-ink-secondary">
                      Rocky answers from this material across sessions.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleBanner}
                  className="flex h-7 shrink-0 items-center gap-1 rounded-md px-1.5 text-[11px] text-ink-muted transition-colors duration-150 ease-ease hover:bg-surface-raised hover:text-ink"
                  aria-label="Minimize study material"
                >
                  <ChevronUp size={14} strokeWidth={1.5} aria-hidden="true" />
                  <span className="hidden sm:inline">Minimize</span>
                </button>
              </div>
              <p className="mt-2 pl-[28px] text-[11px] text-ink-muted">
                Upload another file to replace it.
              </p>
            </div>
          )
        ) : (
          <div className="mx-auto w-full max-w-[860px] rounded-xl border border-line bg-surface p-4">
            <div className="flex items-start gap-2.5">
              <FileText size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-ink">No study material yet</p>
                <p className="mt-1 text-[13px] leading-5 text-ink-secondary">
                  Upload a PDF, Markdown, or text file. Rocky will answer from it.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="mt-3 flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface-raised px-2.5 text-[12px] text-ink transition-colors duration-150 ease-ease hover:bg-surface-high disabled:opacity-40"
                >
                  <Upload size={14} strokeWidth={1.5} aria-hidden="true" />
                  Upload file
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        className={`chat-space flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 ${
          messages.length <= 1 ? 'flex flex-col justify-center' : ''
        }`}
      >
        <div className="mx-auto w-full max-w-[860px] space-y-5">
          {messages.length === 1 && messages[0]?.role === 'rocky' ? (
            <div className="flex flex-col items-center px-4 text-center">
              <div className="h-14 w-14">
                <RockyMascot status="idle" />
              </div>
              <p className="mt-4 text-[13px] font-medium text-ink">Rocky</p>
              <p className="mt-1.5 max-w-[420px] text-[15px] leading-7 text-ink-secondary">
                {messages[0].text}
              </p>
              <p className="mt-2 max-w-[420px] text-[13px] leading-5 text-ink-muted">
                {activeDocument.active
                  ? 'Ask about your notes, or start with a practice mode.'
                  : 'Upload a file above to give Rocky something to work with.'}
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
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
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-line px-4 py-4 md:px-6">
        <div className="mx-auto flex w-full max-w-[860px] flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 shrink-0">
                <RockyMascot status={rockyState} />
              </div>
              <span className="text-[12px] text-ink-muted">Rocky</span>
              <span className="h-2.5 w-0.5 rounded-full bg-ember" aria-hidden="true" />
              <span className="font-mono text-[11px] text-ink-secondary" aria-live="polite">
                {stateLabels[rockyState] || rockyState}
              </span>
            </div>
            <QuickActions quickActions={quickActions} handleQuickAction={handleQuickAction} />
          </div>

          <ChatInput
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            handleFileUpload={handleFileUpload}
            isUploading={isUploading}
            isSending={isSending}
            rockyState={rockyState}
            fileInputRef={fileInputRef}
            chatInputRef={chatInputRef}
          />
        </div>
      </div>
    </div>
  );
}
