import React, { lazy, Suspense, useState } from 'react';
import { Check, Code2, Copy, Download, Loader2, Network, PackageOpen, X } from 'lucide-react';

const MermaidRenderer = lazy(() => import('./MermaidRenderer'));

export default function ArtifactPanel({
  artifact,
  showArtifacts,
  setShowArtifacts,
  handleDownload,
  handleExport,
  rockyState,
}) {
  const [copied, setCopied] = useState(false);

  if (!showArtifacts) return null;

  const loading = rockyState === 'thinking' || rockyState === 'troubleshooting';
  const isMindmap = artifact.type === 'mindmap';
  const isCode = artifact.type === 'code';

  const copy = async () => {
    const ok = await handleExport();
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <>
      <div
        onClick={() => setShowArtifacts(false)}
        className="fixed inset-0 z-30 bg-black/50 animate-fade-in lg:hidden"
        aria-hidden="true"
      />
      <aside className="animate-slide-right-in fixed inset-y-0 right-0 z-40 flex w-full max-w-[440px] shrink-0 flex-col border-l border-line bg-background lg:static lg:z-auto lg:w-[400px] lg:max-w-none lg:animate-none xl:w-[440px]">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-4 py-4">
          <div className="min-w-0">
            <h2 className="text-[15px] font-medium text-ink">Artifacts</h2>
            <p className="mt-1 text-[12px] text-ink-muted">Generated from your notes</p>
          </div>
          <button
            type="button"
            onClick={() => setShowArtifacts(false)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors duration-150 ease-ease hover:bg-surface hover:text-ink"
            aria-label="Close artifacts"
          >
            <X size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center gap-2 py-2 text-[13px] text-ink-secondary">
              <Loader2 size={15} strokeWidth={1.5} className="animate-spin text-ember" aria-hidden="true" />
              Generating artifact
            </div>
          ) : artifact.type === null ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <PackageOpen size={24} strokeWidth={1.5} className="text-ink-muted" aria-hidden="true" />
              <p className="mt-3 text-[13px] font-medium text-ink">No artifacts yet</p>
              <p className="mt-1 max-w-[240px] text-[12px] leading-5 text-ink-muted">
                Quizzes, mindmaps, and code reviews appear here.
              </p>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-ink-muted">
                    {isMindmap ? (
                      <Network size={14} strokeWidth={1.5} aria-hidden="true" />
                    ) : (
                      <Code2 size={14} strokeWidth={1.5} aria-hidden="true" />
                    )}
                    <span>{isMindmap ? 'Mindmap' : 'Code review'}</span>
                  </div>
                  <h3 className="mt-1 truncate text-[14px] font-medium text-ink" title={artifact.title}>
                    {artifact.title}
                  </h3>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-[12px] text-ink-secondary transition-colors duration-150 ease-ease hover:bg-surface-raised hover:text-ink"
                  >
                    <Download size={14} strokeWidth={1.5} aria-hidden="true" />
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={copy}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-[12px] text-ink-secondary transition-colors duration-150 ease-ease hover:bg-surface-raised hover:text-ink"
                  >
                    {copied ? (
                      <Check size={14} strokeWidth={1.5} aria-hidden="true" />
                    ) : (
                      <Copy size={14} strokeWidth={1.5} aria-hidden="true" />
                    )}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex-1">
                {isMindmap && (
                  <div className="w-full overflow-x-auto rounded-xl border border-line bg-surface p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full">
                    <Suspense
                      fallback={
                        <div className="flex items-center gap-2 text-xs text-ink-muted">
                          <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                          Rendering diagram
                        </div>
                      }
                    >
                      <MermaidRenderer chart={artifact.content} />
                    </Suspense>
                  </div>
                )}

                {isCode && (
                  <div className="overflow-hidden rounded-xl border border-line bg-[#11100f]">
                    <div className="flex items-center justify-between border-b border-line px-3 py-2">
                      <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-muted">
                        <Code2 size={13} strokeWidth={1.5} aria-hidden="true" />
                        {artifact.language || 'code'}
                      </span>
                    </div>
                    <pre className="overflow-x-auto p-4 text-[12.5px] leading-relaxed text-ink-secondary">
                      <code>{artifact.content}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
