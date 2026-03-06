import { FC, CSSProperties, useEffect } from 'react';
import mermaid from 'mermaid';
import './styles.css';

interface PreviewProps {
  html: string;
  css: string;
  error: string | null;
  style?: CSSProperties;
}

// Mermaidの初期設定
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
});

const Preview: FC<PreviewProps> = ({ html, css, error, style }) => {
  // HTMLが変更されたらMermaidを再レンダリング
  useEffect(() => {
    if (html && !error) {
      // 少し待ってからレンダリング (DOM反映待ち)
      const timer = setTimeout(() => {
        mermaid.run({
          querySelector: '.language-mermaid',
        }).catch(err => {
          console.error('Mermaid rendering error:', err);
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [html, error]);

  if (error) {
    return (
      <div className="preview" style={style}>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="preview" style={style}>
      <style>{css}</style>
      <div
        className="preview-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

export default Preview;
