import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import ArtifactPanel from './components/ArtifactPanel';
import OnboardingModal from './components/OnboardingModal';
import useChat from './hooks/useChat';
import useArtifact from './hooks/useArtifact';
import { fetchResearchLog, fetchSystemStatus, fetchArtifacts } from './services/api';

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
    sendMessage,
    handleFileUpload,
    activeDocument,
    profile,
    setProfile
  } = useChat();

  const {
    artifact,
    setArtifact,
    showArtifacts,
    setShowArtifacts,
    extractArtifact,
    handleDownload,
    handleExport
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
    { label: '📝 Quiz', prompt: 'Generate a quiz on the following topic: ' },
    { label: '🗺️ Mindmap', prompt: 'Draw a mindmap of the following concept: ' },
    { label: '👔 Interview', prompt: 'Conduct a practice interview on: ' },
    { label: '🐛 Debug', prompt: 'Check this code for errors:\n\n' }
  ];

  const handleQuickAction = (promptText) => {
    if (window.typingInterval) {
      clearInterval(window.typingInterval);
    }
    
    let currentText = '';
    let i = 0;
    
    window.typingInterval = setInterval(() => {
      if (i < promptText.length) {
        currentText += promptText[i];
        setInput(currentText);
        i++;
      } else {
        clearInterval(window.typingInterval);
        setTimeout(() => {
          chatInputRef.current?.focus();
        }, 50);
      }
    }, 12);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-sans">
      {/* Left Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area (Header + Split Pane Layout) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Global Header */}
        <Header
          artifact={artifact}
          showArtifacts={showArtifacts}
          setShowArtifacts={setShowArtifacts}
          profile={profile}
        />

        {/* Two-Pane split area - always render expeditions to keep chat active */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative">
          {/* Left "chat-pane" */}
          <ChatWindow
            showArtifacts={showArtifacts}
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
            fileInputRef={fileInputRef}
            chatInputRef={chatInputRef}
            activeDocument={activeDocument}
          />

          {/* Right "artifacts-pane" */}
          <ArtifactPanel
            artifact={artifact}
            showArtifacts={showArtifacts}
            setShowArtifacts={setShowArtifacts}
            handleDownload={handleDownload}
            handleExport={handleExport}
            rockyState={rockyState}
          />

          {/* Collapsed Artifacts Handle Tab */}
          {artifact.type !== null && !showArtifacts && (
            <button
              onClick={() => setShowArtifacts(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-basalt border-l border-y border-magma/40 text-magma hover:bg-magma hover:text-white px-2.5 py-4 rounded-l-xl text-xs font-mono transition-all duration-300 active:scale-95 cursor-pointer flex flex-col items-center gap-1.5 shadow-2xl hover:border-magma"
              title="Open Artifact Panel"
            >
              <span>◀</span>
              <span>📦</span>
            </button>
          )}
        </div>

        {/* Research Log Drawer (Slide from Left) */}
        {activeTab === 'research-log' && (
          <div 
            className="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-sm modal-backdrop-animate"
            onClick={() => setActiveTab('expeditions')}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-surface-bright border-r border-outline-variant/30 shadow-2xl flex flex-col h-full animate-slide-left-in"
            >
              <div className="flex justify-between items-center p-6 border-b border-outline-variant/20">
                <div>
                  <h2 className="font-bold text-xenonite text-xl font-heading">Research Log</h2>
                  <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">Expedition logs and performance records</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-magma/15 border border-magma/30 text-magma text-xs px-3 py-1 rounded-full font-mono font-bold">
                    {researchLog.length} Topics Tracked
                  </span>
                  <button
                    onClick={() => setActiveTab('expeditions')}
                    className="text-on-surface-variant hover:text-magma p-1.5 rounded-lg hover:bg-surface-container-high transition-all cursor-pointer font-sans"
                  >
                    Close ✕
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {researchLog.length > 0 ? (
                  researchLog.map((item, index) => (
                    <div key={index} className="bg-basalt/40 border border-outline-variant/15 p-4 rounded-xl flex justify-between items-center shadow-md">
                      <div>
                        <h3 className="font-bold text-on-surface text-sm font-heading">{item.topic}</h3>
                        <p className="text-xs text-on-surface-variant font-sans mt-1">Times flagged: {item.times_flagged}</p>
                      </div>
                      <span className="text-[10px] text-on-surface-variant/70 font-mono">
                        {item.last_flagged_at ? item.last_flagged_at.split('T')[0] : ''}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto bg-basalt/20 border border-outline-variant/10 rounded-2xl p-6 shadow-inner w-full animate-fade-in">
                    <div className="text-5xl mb-4 filter drop-shadow(0 0 8px rgba(226, 167, 111, 0.3)) animate-bounce select-none">📝</div>
                    <h3 className="font-bold text-on-surface text-base mb-1 font-heading">No Difficult Topics</h3>
                    <p className="text-xs font-sans text-on-surface-variant/70 leading-relaxed">
                      No difficult topics recorded yet — Rocky will log topics here automatically as you study.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Archived Artifacts Drawer (Slide from Right) */}
        {activeTab === 'archived-artifacts' && (
          <div 
            className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm modal-backdrop-animate"
            onClick={() => setActiveTab('expeditions')}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-surface-bright border-l border-outline-variant/30 shadow-2xl flex flex-col h-full animate-slide-right-in"
            >
              <div className="flex justify-between items-center p-6 border-b border-outline-variant/20">
                <div>
                  <h2 className="font-bold text-xenonite text-xl font-heading">Archived Artifacts</h2>
                  <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">History and backup repositories</p>
                </div>
                <button
                  onClick={() => setActiveTab('expeditions')}
                  className="text-on-surface-variant hover:text-magma p-1.5 rounded-lg hover:bg-surface-container-high transition-all cursor-pointer font-sans"
                >
                  Close ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {archivedArtifacts.length > 0 ? (
                  <div className="space-y-4">
                    {archivedArtifacts.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setArtifact({
                            type: item.type,
                            title: item.title,
                            content: item.content,
                            language: item.language
                          });
                          setShowArtifacts(true);
                          setActiveTab('expeditions');
                        }}
                        className="bg-basalt/40 border border-outline-variant/15 p-4 rounded-xl flex justify-between items-center shadow-md cursor-pointer hover:bg-basalt/60 transition-colors"
                      >
                        <div>
                          <h3 className="font-bold text-on-surface text-sm font-heading">{item.title}</h3>
                          <p className="text-xs text-on-surface-variant font-sans mt-1">
                            Type: {item.type === 'mindmap' ? '📊 mindmap' : '💻 code'}
                          </p>
                        </div>
                        <span className="text-[10px] text-on-surface-variant/70 font-mono">
                          {item.created_at ? item.created_at.split('T')[0] : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto bg-basalt/20 border border-outline-variant/10 rounded-2xl p-6 shadow-inner w-full animate-fade-in">
                    <div className="text-5xl mb-4 text-on-surface-variant/40 filter drop-shadow(0 0 8px rgba(0,0,0,0.3)) select-none">🗄️</div>
                    <h3 className="font-bold text-on-surface text-base mb-1 font-heading">Archive Empty</h3>
                    <p className="text-xs font-sans text-on-surface-variant/70 leading-relaxed">
                      There are currently no archived diagrams, quizzes, or code records in the local storage vault. Compilations will remain active in the workspace until explicitly cataloged.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Core Status Modal Panel */}
        {activeTab === 'core-status' && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 modal-backdrop-animate"
            onClick={() => setActiveTab('expeditions')}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-surface-bright border border-outline-variant/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative font-sans text-on-surface modal-content-animate flex flex-col justify-center"
            >
              <button
                onClick={() => setActiveTab('expeditions')}
                className="absolute top-4 right-4 text-on-surface-variant hover:text-magma p-1.5 rounded-lg hover:bg-surface-container-high transition-all cursor-pointer font-sans"
              >
                ✕ Close
              </button>
              <div className="flex items-center space-x-3 border-b border-outline-variant/20 pb-3 mb-5">
                <div className="w-3.5 h-3.5 rounded-full bg-[#7fffd4] animate-ping absolute"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-[#7fffd4] relative"></div>
                <h3 className="font-bold text-xenonite text-lg font-mono tracking-wide">Core Status Monitor</h3>
              </div>
              {!systemStatus ? (
                <div className="flex flex-col items-center justify-center py-12 text-center w-full">
                  <div className="w-8 h-8 border-4 border-magma/30 border-t-magma rounded-full animate-spin mb-4"></div>
                  <div className="text-xs font-mono text-on-surface-variant animate-pulse">
                    Synaptic handshake in progress...
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-background/80 border border-outline-variant/15 p-4 rounded-xl flex flex-col">
                      <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest">Main Reactor</span>
                      <span className={`font-bold text-lg font-mono mt-1 ${systemStatus.gemini_active ? 'text-[#7fffd4]' : 'text-[#ff4a4a]'}`}>
                        {systemStatus.gemini_active ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                    <div className="bg-background/80 border border-outline-variant/15 p-4 rounded-xl flex flex-col">
                      <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest">Memory Database</span>
                      <span className="text-[#7fffd4] font-bold text-lg font-mono mt-1">{systemStatus.difficult_topics_count}</span>
                    </div>
                    <div className="bg-background/80 border border-outline-variant/15 p-4 rounded-xl flex flex-col">
                      <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest">MCP Pipeline</span>
                      <span className={`font-bold text-lg font-mono mt-1 ${systemStatus.mcp_connected ? 'text-[#7fffd4]' : 'text-[#ff4a4a]'}`}>
                        {systemStatus.mcp_connected ? 'CONNECTED' : 'DISCONNECTED'}
                      </span>
                    </div>
                    <div className="bg-background/80 border border-outline-variant/15 p-4 rounded-xl flex flex-col">
                      <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest">Core Version</span>
                      <span className="text-on-surface font-bold text-lg font-mono mt-1">{systemStatus.model_name}</span>
                    </div>
                  </div>
                  <div className="mt-5 bg-background/50 border border-outline-variant/10 p-3 rounded-xl text-center text-xs text-on-surface-variant/80 font-mono">
                    All subsystems reporting nominal crystallization parameters.
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {!profile.hasProfile && (
        <OnboardingModal setProfile={setProfile} />
      )}
    </div>
  );
}