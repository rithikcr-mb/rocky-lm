import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  securityLevel: 'strict',
  fontFamily: '"Space Grotesk", sans-serif',
  themeVariables: {
    background: '#191816',
    mainBkg: '#211f1c',
    primaryColor: '#211f1c',
    primaryTextColor: '#efeae3',
    primaryBorderColor: '#e08a4a',
    secondaryColor: '#2a2723',
    tertiaryColor: '#191816',
    textColor: '#efeae3',
    lineColor: '#8b8278',
    nodeBorder: '#e08a4a',
    edgeLabelBackground: '#141312',
    clusterBkg: '#191816',
    clusterBorder: '#3a3631',
    titleColor: '#efeae3',
    fontSize: '13px',
  },
});

export default function MermaidRenderer({ chart }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const elementId = useRef(`mermaid-${Math.floor(Math.random() * 10000000)}`);

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      try {
        setError(null);
        const cleanChart = chart.trim();
        if (!cleanChart) return;

        const { svg: renderedSvg } = await mermaid.render(elementId.current, cleanChart);
        if (isMounted) {
          setSvg(renderedSvg);
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        if (isMounted) {
          setError(err.message || 'Failed to render diagram');
        }
      }
    };

    renderChart();
    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="rounded-lg border border-line bg-surface p-3 text-xs">
        <div className="mb-1.5 flex items-center gap-1.5 text-[12px] text-negative">
          <AlertCircle size={14} strokeWidth={1.5} aria-hidden="true" />
          Diagram could not be rendered
        </div>
        <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-ink-muted">{chart}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-ink-muted">
        <Loader2 size={14} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
        Rendering diagram
      </div>
    );
  }

  return (
    <div
      className="mermaid-diagram flex justify-center overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
