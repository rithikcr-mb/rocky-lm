import React, { lazy, Suspense, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy, Loader2 } from 'lucide-react';

const MermaidRenderer = lazy(() => import('./MermaidRenderer'));

function CodeBlock({ className, children }) {
  const [copied, setCopied] = useState(false);
  const language = (/language-(\w+)/.exec(className || '') || [])[1] || 'code';
  const code = String(children).replace(/\n$/, '');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-line bg-[#11100f]">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <span className="font-mono text-[11px] text-ink-muted">{language}</span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] text-ink-muted transition-colors duration-150 ease-ease hover:bg-surface hover:text-ink"
        >
          {copied ? <Check size={13} strokeWidth={1.5} /> : <Copy size={13} strokeWidth={1.5} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 text-[12.5px] leading-relaxed text-ink-secondary">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

const renderers = {
  h1: ({ children }) => (
    <h1 className="mb-2 mt-5 border-b border-line pb-2 text-lg font-medium text-ink">{children}</h1>
  ),
  h2: ({ children }) => <h2 className="mb-2 mt-5 text-base font-medium text-ink">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1.5 mt-4 text-sm font-medium text-ink">{children}</h3>,
  p: ({ children }) => <p className="mb-3 last:mb-0 leading-6 text-ink-secondary">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1.5 pl-5 text-ink-secondary">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-ink-secondary">{children}</ol>,
  li: ({ children }) => <li className="leading-6">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-ember-soft underline decoration-ember/40 underline-offset-2 transition-colors duration-150 ease-ease hover:text-ember"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-ember/50 pl-4 text-ink-secondary">{children}</blockquote>
  ),
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className || '');
    const isMermaid = match && match[1] === 'mermaid';
    const codeString = String(children).replace(/\n$/, '');

    if (isMermaid) {
      return (
        <Suspense
          fallback={
            <div className="my-4 flex items-center gap-2 text-xs text-ink-muted">
              <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
              Rendering diagram
            </div>
          }
        >
          <MermaidRenderer chart={codeString} />
        </Suspense>
      );
    }

    const isInline = !match && !String(children).includes('\n');

    if (isInline) {
      return (
        <code
          className="rounded border border-line bg-surface-raised px-1.5 py-0.5 font-mono text-[12px] text-ember-soft"
        >
          {children}
        </code>
      );
    }

    return <CodeBlock className={className}>{children}</CodeBlock>;
  },
};

function loadingLabel(messages) {
  const userMessages = messages.filter((m) => m.role === 'user');
  if (userMessages.length === 0) return 'Reading your request';
  const lastText = userMessages[userMessages.length - 1].text.toLowerCase();

  if (lastText.includes('quiz') || lastText.includes('question')) return 'Building a quiz';
  if (lastText.includes('mindmap') || lastText.includes('concept') || lastText.includes('draw') || lastText.includes('map')) {
    return 'Mapping the concept';
  }
  if (lastText.includes('interview') || lastText.includes('practice')) return 'Preparing an interview';
  if (lastText.includes('debug') || lastText.includes('code') || lastText.includes('error') || lastText.includes('fix')) {
    return 'Reviewing the code';
  }
  if (lastText.includes('upload') || lastText.includes('document') || lastText.includes('pdf')) {
    return 'Reading the document';
  }
  return 'Looking through your notes';
}

export default function ChatMessage({
  msg,
  index,
  rockyState,
  actualLatestRockyIndex,
  artifact,
  setArtifact,
  setShowArtifacts,
  extractArtifact,
  messages = [],
}) {
  const extracted =
    msg.role === 'rocky' && rockyState !== 'thinking' ? extractArtifact(msg.text) : null;
  const textToShow = extracted ? extracted.remainingText : msg.text;

  useEffect(() => {
    if (!extracted || index !== actualLatestRockyIndex || artifact.content === extracted.content) {
      return;
    }

    setArtifact({
      type: extracted.type,
      title: extracted.title,
      content: extracted.content,
      language: extracted.language || '',
    });
    setShowArtifacts(true);
  }, [actualLatestRockyIndex, artifact.content, extracted, index, setArtifact, setShowArtifacts]);

  if (msg.role === 'system') {
    return (
      <div className="flex justify-center py-2">
        <p className="max-w-[90%] text-center font-mono text-[11px] leading-5 text-ink-muted">{msg.text}</p>
      </div>
    );
  }

  const isUser = msg.role === 'user';

  return (
    <div
      className={`chat-message-animate flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`min-w-0 ${isUser ? 'max-w-[86%] md:max-w-[72%]' : 'w-full max-w-[720px]'}`}>
        <p className={`mb-1.5 text-[11px] font-medium text-ink-muted ${isUser ? 'text-right' : ''}`}>
          {isUser ? 'You' : 'Rocky'}
        </p>
        {isUser ? (
          <div className="whitespace-pre-wrap rounded-xl border border-line bg-surface-raised px-3.5 py-2.5 text-[14px] leading-6 text-ink">
            {textToShow}
          </div>
        ) : textToShow ? (
          <div className="text-[14px] leading-6">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers}>
              {textToShow}
            </ReactMarkdown>
          </div>
        ) : (
          rockyState === 'thinking' && (
            <div className="flex items-center gap-2 py-1 text-[13px] text-ink-secondary">
              <Loader2 size={14} strokeWidth={1.5} className="animate-spin text-ember" aria-hidden="true" />
              <span>{loadingLabel(messages)}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
