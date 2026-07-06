import React from 'react';
import MermaidRenderer from './MermaidRenderer';

export default function ArtifactPanel({
  artifact,
  showArtifacts,
  setShowArtifacts,
  handleDownload,
  handleExport,
  rockyState
}) {
  return (
    <>
      {/* Mobile-only backdrop overlay */}
      {showArtifacts && (
        <div 
          onClick={() => setShowArtifacts(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden animate-fade-in"
        />
      )}
      <div className={`artifacts-panel fixed inset-y-0 right-0 z-40 lg:relative lg:inset-auto lg:z-auto flex w-full sm:w-[500px] lg:w-[40%] flex-col bg-surface-bright border-l border-outline-variant/20 transition-all duration-300 ease-in-out ${
        showArtifacts
          ? 'translate-x-0 opacity-100 pointer-events-auto shadow-2xl'
          : 'translate-x-full opacity-0 pointer-events-none lg:translate-x-0 lg:opacity-100 lg:w-0 lg:p-0 border-l-0 overflow-hidden'
      }`}>
      <div className="px-6 py-4 flex justify-between items-center border-b border-outline-variant/20">
        <div className="flex flex-col">
          <h2 className="font-bold text-xenonite text-lg font-heading flex items-center gap-2">
            <span>📦</span>
            <span>Artifacts</span>
          </h2>
          <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider opacity-60">
            Generated Outputs
          </span>
        </div>
        <button 
          type="button"
          onClick={() => setShowArtifacts(false)}
          className="text-on-surface-variant hover:text-white hover:bg-red-500/10 hover:border-red-500/20 border border-transparent w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer text-sm font-bold"
          title="Close Panel"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 flex flex-col justify-start overflow-y-auto p-4 sm:p-6">
        {rockyState === 'thinking' || rockyState === 'troubleshooting' ? (
          <div className="animate-pulse flex flex-col space-y-4 p-6 sm:p-8 rounded-2xl bg-basalt/25 border border-outline-variant/15 shadow-inner">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-basalt/60 rounded-full"></div>
              <div className="h-6 bg-basalt/60 rounded w-1/3"></div>
            </div>
            <div className="h-4 bg-basalt/40 rounded w-full"></div>
            <div className="h-4 bg-basalt/40 rounded w-5/6"></div>
            <div className="h-4 bg-basalt/40 rounded w-4/6"></div>
            <div className="h-32 bg-basalt/20 rounded-xl w-full border border-outline-variant/10 mt-4"></div>
          </div>
        ) : artifact.type === null ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center max-w-sm mx-auto p-6 sm:p-8 rounded-2xl bg-basalt/25 border border-outline-variant/15 shadow-inner">
            <div className="text-5xl mb-4 animate-pulse text-[#e67e22]/90 filter drop-shadow(0 0 10px rgba(230, 126, 34, 0.4)) select-none">📦</div>
            <h3 className="font-bold text-on-surface text-base mb-1 font-heading tracking-wide">Artifact Repository</h3>
            <p className="text-xs font-sans text-on-surface-variant/75 leading-relaxed">
              No artifacts have been compiled yet. Start a study expedition or request code reviews to generate active documents here.
            </p>
          </div>
        ) : (
          <div key={artifact.title} className="animate-fade-in bg-basalt/60 backdrop-blur-md border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Card Header */}
            <div className="flex justify-between items-center bg-[#1c1714] px-5 py-4 border-b border-outline-variant/20">
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5 text-[10px] text-on-surface-variant font-mono uppercase tracking-wider mb-0.5 opacity-75">
                  <span>{artifact.type === 'mindmap' ? '🧠' : '💻'}</span>
                  <span>{artifact.type === 'mindmap' ? 'Mindmap' : 'Code'}</span>
                </div>
                <span className="font-bold text-sm text-xenonite font-heading">
                  {artifact.title}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleDownload}
                  className="text-xs border border-outline-variant/30 rounded-lg px-3 py-1.5 bg-basalt text-on-surface hover:bg-[#e67e22] hover:text-white hover:border-[#e67e22] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-sans shadow-md font-medium"
                >
                  Download
                </button>
                <button 
                  onClick={handleExport}
                  className="text-xs border border-outline-variant/30 rounded-lg px-3 py-1.5 bg-basalt text-on-surface hover:bg-[#e67e22] hover:text-white hover:border-[#e67e22] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-sans shadow-md font-medium"
                >
                  Export
                </button>
              </div>
            </div>
            {/* Card Content Area */}
            <div className="p-5 flex flex-col overflow-y-auto">
              {artifact.type === 'mindmap' && (
                <div className="w-full min-h-[200px] flex items-center justify-center [&_svg]:max-w-full [&_svg]:h-auto">
                  <MermaidRenderer chart={artifact.content} />
                </div>
              )}
              {artifact.type === 'code' && (
                <div className="bg-[#1e1e1e] rounded-xl overflow-hidden border border-outline-variant/20 shadow-2xl flex flex-col h-full">
                  {/* IDE Header */}
                  <div className="bg-[#2d241e] px-4 py-2.5 flex items-center justify-between border-b border-outline-variant/20">
                    <div className="flex space-x-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-red-500/80"></div>
                      <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80"></div>
                      <div className="w-3.5 h-3.5 rounded-full bg-green-500/80"></div>
                    </div>
                    <span className="text-[10px] text-magma font-mono uppercase tracking-widest font-bold">{artifact.language}</span>
                  </div>
                  {/* Code Content */}
                  <pre className="p-4 overflow-x-auto text-sm font-mono text-[#d4d4d4] leading-relaxed flex-1 bg-[#12100e]">
                    <code>{artifact.content}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
