import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  Archive,
  ChevronLeft,
  Code2,
  Loader2,
  Network,
  NotebookText,
  PackageOpen,
  X,
} from 'lucide-react';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import ArtifactPanel from './components/ArtifactPanel';
import OnboardingModal from './components/OnboardingModal';
import useChat from './hooks/useChat';
import useArtifact from './hooks/useArtifact';
import { fetchResearchLog, fetchSystemStatus, fetchArtifacts } from './services/api';

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusDot({ ok }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-[1px] ${ok ? 'bg-positive' : 'bg-negative'}`}
      aria-hidden="true"
    />
  );
}

function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <Icon size={24} strokeWidth={1.5} className="text-ink-muted" aria-hidden="true" />
      <p className="mt-3 text-[13px] font-medium text-ink">{title}</p>
      <p className="mt-1 max-w-[260px] text-[12px] leading-5 text-ink-muted">{children}</p>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('expeditions');
  const [researchLog, setResearchLog] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [archivedArtifacts, setArchivedArtifacts] = useState([]);

  const {
    messages,
    input,
    setInput,
    rockyState,
    isUploading,
    isSending,
    sendMessage,
    handleFileUpload,
    activeDocument,
    profile,
    setProfile,
  } = useChat();

  const {
    artifact,
    setArtifact,
    showArtifacts,
    setShowArtifacts,
    extractArtifact,
    handleDownload,
    handleExport,
  } = useArtifact();

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatInputRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'research-log') {
      fetchResearchLog()
        .then((data) => {
          setResearchLog(data.topics || []);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'core-status') {
      const fetchStatus = () => {
        fetchSystemStatus()
          .then((data) => {
            setSystemStatus(data);
          })
          .catch((err) => {
            console.error(err);
          });
      };
      fetchStatus();
      const interval = setInterval(fetchStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'archived-artifacts') {
      fetchArtifacts()
        .then((data) => {
          setArchivedArtifacts(data.artifacts || []);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveTab('expeditions');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const quickActions = [
    { id: 'quiz', label: 'Quiz', prompt: 'Generate a quiz on the following topic: ' },
    { id: 'mindmap', label: 'Mindmap', prompt: 'Draw a mindmap of the following concept: ' },
    { id: 'interview', label: 'Interview', prompt: 'Conduct a practice interview on: ' },
    { id: 'debug', label: 'Debug', prompt: 'Check this code for errors:\n\n' },
  ];

  const handleQuickAction = (promptText) => {
    setInput(promptText);
    requestAnimationFrame(() => chatInputRef.current?.focus());
  };

  const closeTab = () => setActiveTab('expeditions');

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header profile={profile} />

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <ChatWindow
            messages={messages}
            rockyState={rockyState}
            artifact={artifact}
            setArtifact={setArtifact}
            setShowArtifacts={setShowArtifacts}
            extractArtifact={extractArtifact}
            messagesEndRef={messagesEndRef}
            quickActions={quickActions}
            handleQuickAction={handleQuickAction}
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            handleFileUpload={handleFileUpload}
            isUploading={isUploading}
            isSending={isSending}
            fileInputRef={fileInputRef}
            chatInputRef={chatInputRef}
            activeDocument={activeDocument}
          />

          <ArtifactPanel
            artifact={artifact}
            showArtifacts={showArtifacts}
            setShowArtifacts={setShowArtifacts}
            handleDownload={handleDownload}
            handleExport={handleExport}
            rockyState={rockyState}
          />

          {artifact.type !== null && !showArtifacts && (
            <button
              type="button"
              onClick={() => setShowArtifacts(true)}
              className="absolute right-0 top-1/2 z-20 flex h-20 w-9 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-l-lg border border-r-0 border-line bg-surface text-ink-muted transition-colors duration-150 ease-ease hover:bg-surface-raised hover:text-ink"
              aria-label="Open artifacts"
              title="Open artifacts"
            >
              <ChevronLeft size={14} strokeWidth={1.5} aria-hidden="true" />
              <PackageOpen size={16} strokeWidth={1.5} aria-hidden="true" />
            </button>
          )}
        </div>

        {activeTab === 'research-log' && (
          <div
            className="modal-backdrop-animate fixed inset-0 z-50 flex bg-black/50"
            onClick={closeTab}
            role="presentation"
          >
            <section
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="research-log-title"
              className="animate-slide-left-in flex h-full w-full max-w-[440px] flex-col border-r border-line bg-background"
            >
              <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
                <div>
                  <h2 id="research-log-title" className="text-lg font-medium text-ink">
                    Research log
                  </h2>
                  <p className="mt-1 text-[12px] text-ink-muted">Topics Rocky has flagged</p>
                </div>
                <button
                  type="button"
                  onClick={closeTab}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors duration-150 ease-ease hover:bg-surface hover:text-ink"
                  aria-label="Close research log"
                >
                  <X size={16} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </header>

              <div className="flex flex-1 flex-col overflow-y-auto p-4">
                {researchLog.length > 0 ? (
                  <>
                    <p className="mb-3 font-mono text-[11px] text-ink-muted">
                      {researchLog.length} {researchLog.length === 1 ? 'topic' : 'topics'}
                    </p>
                    <ul className="space-y-2">
                      {researchLog.map((item, index) => (
                        <li
                          key={`${item.topic}-${index}`}
                          className="rounded-xl border border-line bg-surface px-4 py-3.5"
                        >
                          <p className="text-[13px] font-medium text-ink">{item.topic}</p>
                          <p className="mt-1 font-mono text-[11px] tabular-nums text-ink-muted">
                            {item.times_flagged} {item.times_flagged === 1 ? 'time' : 'times'}
                            {item.last_flagged_at ? ` · last ${formatDate(item.last_flagged_at)}` : ''}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center">
                    <EmptyState icon={NotebookText} title="No difficult topics yet">
                      Rocky logs a topic here when you say you are struggling with it.
                    </EmptyState>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'archived-artifacts' && (
          <div
            className="modal-backdrop-animate fixed inset-0 z-50 flex justify-end bg-black/50"
            onClick={closeTab}
            role="presentation"
          >
            <section
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="archive-title"
              className="animate-slide-right-in flex h-full w-full max-w-[440px] flex-col border-l border-line bg-background"
            >
              <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
                <div>
                  <h2 id="archive-title" className="text-lg font-medium text-ink">
                    Archived artifacts
                  </h2>
                  <p className="mt-1 text-[12px] text-ink-muted">Saved mindmaps and code reviews</p>
                </div>
                <button
                  type="button"
                  onClick={closeTab}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors duration-150 ease-ease hover:bg-surface hover:text-ink"
                  aria-label="Close archive"
                >
                  <X size={16} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </header>

              <div className="flex flex-1 flex-col overflow-y-auto p-4">
                {archivedArtifacts.length > 0 ? (
                  <ul className="space-y-2">
                    {archivedArtifacts.map((item, index) => {
                      const Icon = item.type === 'mindmap' ? Network : Code2;
                      return (
                        <li key={`${item.title}-${index}`}>
                          <button
                            type="button"
                            onClick={() => {
                              setArtifact({
                                type: item.type,
                                title: item.title,
                                content: item.content,
                                language: item.language,
                              });
                              setShowArtifacts(true);
                              closeTab();
                            }}
                            className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3.5 text-left transition-colors duration-150 ease-ease hover:bg-surface-raised"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-raised text-ink-muted">
                              <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-medium text-ink">
                                {item.title}
                              </span>
                              <span className="mt-1 block font-mono text-[11px] text-ink-muted">
                                {item.type === 'mindmap' ? 'Mindmap' : 'Code review'}
                                {item.created_at ? ` · ${formatDate(item.created_at)}` : ''}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="flex flex-1 items-center justify-center">
                    <EmptyState icon={Archive} title="Nothing archived yet">
                      Generated artifacts are saved here.
                    </EmptyState>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'core-status' && (
          <div
            className="modal-backdrop-animate fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={closeTab}
            role="presentation"
          >
            <section
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="core-status-title"
              className="modal-content-animate w-full max-w-[520px] rounded-2xl border border-line bg-surface shadow-overlay"
            >
              <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
                <div className="flex items-start gap-2.5">
                  <Activity size={18} strokeWidth={1.5} className="mt-0.5 text-ink-muted" aria-hidden="true" />
                  <div>
                    <h2 id="core-status-title" className="text-lg font-medium text-ink">
                      Core status
                    </h2>
                    <p className="mt-1 text-[12px] text-ink-muted">Live service checks</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeTab}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors duration-150 ease-ease hover:bg-surface-raised hover:text-ink"
                  aria-label="Close core status"
                >
                  <X size={16} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </header>

              <div className="p-5">
                {!systemStatus ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-[13px] text-ink-secondary">
                    <Loader2 size={16} strokeWidth={1.5} className="animate-spin text-ember" aria-hidden="true" />
                    Loading status
                  </div>
                ) : (
                  <>
                    <dl className="divide-y divide-line rounded-xl border border-line bg-background">
                      <div className="flex items-center justify-between gap-4 px-4 py-3">
                        <dt className="text-[13px] text-ink-secondary">Model</dt>
                        <dd className="font-mono text-[12px] text-ink">{systemStatus.model_name}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 px-4 py-3">
                        <dt className="text-[13px] text-ink-secondary">Main model</dt>
                        <dd className="flex items-center gap-2 font-mono text-[12px] text-ink">
                          <StatusDot ok={systemStatus.gemini_active} />
                          {systemStatus.gemini_active ? 'Online' : 'Offline'}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 px-4 py-3">
                        <dt className="text-[13px] text-ink-secondary">Memory</dt>
                        <dd className="font-mono text-[12px] tabular-nums text-ink">
                          {systemStatus.difficult_topics_count}{' '}
                          {systemStatus.difficult_topics_count === 1 ? 'topic' : 'topics'}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 px-4 py-3">
                        <dt className="text-[13px] text-ink-secondary">MCP pipeline</dt>
                        <dd className="flex items-center gap-2 font-mono text-[12px] text-ink">
                          <StatusDot ok={systemStatus.mcp_connected} />
                          {systemStatus.mcp_connected ? 'Connected' : 'Disconnected'}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 px-4 py-3">
                        <dt className="shrink-0 text-[13px] text-ink-secondary">Study material</dt>
                        <dd className="min-w-0 truncate font-mono text-[12px] text-ink" title={systemStatus.active_document_name}>
                          {systemStatus.active_document_name || 'None'}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-4 text-center font-mono text-[11px] text-ink-muted">
                      {systemStatus.gemini_active && systemStatus.mcp_connected
                        ? 'All subsystems nominal'
                        : 'Some subsystems need attention'}
                    </p>
                  </>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {!profile.hasProfile && <OnboardingModal setProfile={setProfile} />}
    </div>
  );
}
