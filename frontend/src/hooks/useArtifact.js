import { useState, useEffect } from 'react';
import mermaid from 'mermaid';

export default function useArtifact() {
  const [artifact, setArtifact] = useState({ type: null, title: '', content: '', language: '' });
  const [showArtifacts, setShowArtifactsState] = useState(() => {
    return localStorage.getItem('artifacts-expanded') === 'true';
  });

  const setShowArtifacts = (val) => {
    setShowArtifactsState(val);
    localStorage.setItem('artifacts-expanded', String(val));
  };

  useEffect(() => {
    if (artifact.type === null) {
      setShowArtifacts(false);
    }
  }, [artifact.type]);

  const extractArtifact = (text) => {
    // Search for a fenced ```mermaid ... ``` block
    const mermaidRegex = /```mermaid\s+([\s\S]*?)```/;
    const mermaidMatch = text.match(mermaidRegex);
    if (mermaidMatch) {
      const content = mermaidMatch[1];
      const remainingText = text.replace(mermaidRegex, "📊 Mindmap ready — view it in the Artifacts panel →");
      return {
        type: 'mindmap',
        title: 'Mindmap',
        content: content,
        remainingText: remainingText
      };
    }

    // Search for any other fenced code block with a language tag
    const codeRegex = /```(python|javascript|java|cpp|csharp|c)\s+([\s\S]*?)```/;
    const codeMatch = text.match(codeRegex);
    if (codeMatch) {
      const language = codeMatch[1];
      const content = codeMatch[2];
      const remainingText = text.replace(codeRegex, "🐛 Code reviewed — view it in the Artifacts panel →");
      return {
        type: 'code',
        title: 'Code Review',
        content: content,
        language: language,
        remainingText: remainingText
      };
    }

    return null;
  };

  const handleDownload = () => {
    if (!artifact.content) return;
    
    if (artifact.type === 'mindmap') {
      // Render the Mermaid chart to SVG
      const renderChart = async () => {
        try {
          const { svg } = await mermaid.render('download-render', artifact.content);
          const blob = new Blob([svg], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'mindmap.svg';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (err) {
          console.error('Failed to render mindmap for download:', err);
          alert('Failed to render mindmap. Please try again.');
        }
      };
      renderChart();
    } 
    else if (artifact.type === 'code') {
      // For code, use proper text MIME type
      let filename = 'code';
      const extMap = { 
        python: 'py', 
        javascript: 'js', 
        java: 'java', 
        cpp: 'cpp', 
        csharp: 'cs', 
        c: 'c' 
      };
      
      const ext = extMap[artifact.language.toLowerCase()] || 'txt';
      filename = `code.${ext}`;
      
      const blob = new Blob([artifact.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleExport = async () => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      alert('Exported to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return {
    artifact,
    setArtifact,
    showArtifacts,
    setShowArtifacts,
    extractArtifact,
    handleDownload,
    handleExport
  };
}
