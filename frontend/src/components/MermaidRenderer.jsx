import React, { useState, useRef, useEffect } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid for dark mode with startOnLoad disabled, as we render manually.
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    background: '#2d241e', // matches basalt
    primaryColor: '#161311', // background
    primaryTextColor: '#eae1dd', // on-surface
    lineColor: '#dbc1b6', // on-surface-variant
  }
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

        // In mermaid v10+, render returns a Promise with { svg, bindFunctions }
        const { svg: renderedSvg } = await mermaid.render(elementId.current, cleanChart);
        if (isMounted) {
          setSvg(renderedSvg);
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        if (isMounted) {
          setError(err.message || 'Failed to render Mermaid diagram');
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
      <div className="bg-red-950/40 border border-red-800 text-red-400 p-3 rounded-lg text-xs font-mono my-2 overflow-x-auto">
        <div className="font-bold mb-1">⚠️ Mermaid Error:</div>
        <pre className="text-[11px] leading-relaxed">{chart}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center space-x-2 text-xs text-magma/80 animate-pulse my-4">
        <span>📊</span>
        <span className="font-mono">Compiling conceptual mindmap...</span>
      </div>
    );
  }

  return (
    <div className="mermaid-diagram bg-[#161311] border border-magma/30 p-4 rounded-xl my-2 overflow-x-auto shadow-lg flex justify-center min-w-full">
      <div dangerouslySetInnerHTML={{ __html: svg }} className="flex justify-center" />
    </div>
  );
}
