import { FC, CSSProperties } from 'react';
import './styles.css';

interface PreviewProps {
  html: string;
  css: string;
  error: string | null;
  style?: CSSProperties;
}

const Preview: FC<PreviewProps> = ({ html, css, error, style }) => {
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
