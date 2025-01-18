import { FC } from 'react';
import './styles.css';

interface PreviewProps {
  html: string;
  css: string;
  error: string | null;
}

const Preview: FC<PreviewProps> = ({ html, css, error }) => {
  if (error) {
    return (
      <div className="preview">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="preview">
      <style>{css}</style>
      <div 
        className="preview-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

export default Preview;
