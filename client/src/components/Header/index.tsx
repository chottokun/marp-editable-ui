import { FC, useState } from 'react';
import './styles.css';

interface HeaderProps {
  theme: 'dark' | 'warm';
  content: string;
  onNewFile: () => void;
  onSaveFile: () => void;
  onThemeToggle: () => void;
  onSelectTemplate: (templateName: string) => void; // Add this line
  templates: { name: string; path: string }[]; // Add this line
}

type ExportFormat = 'pptx' | 'html' | 'png';

const Header: FC<HeaderProps> = ({
  theme,
  content,
  onNewFile,
  onSaveFile,
  onThemeToggle,
  onSelectTemplate, // Add this line
  templates, // Add this line
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    try {
      setIsExporting(true);
      const response = await fetch('http://localhost:3001/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markdown: content, format }),
      });

      if (!response.ok) {
        throw new Error(`エクスポートに失敗しました: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presentation.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('エクスポートエラー:', error);
      alert('エクスポート中にエラーが発生しました');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="header">
      <h1>✨ Marp Editable Slides Demo</h1>
      <div className="toolbar">
        <button onClick={onNewFile} disabled={isExporting}>新規</button>
        <button onClick={onSaveFile} disabled={isExporting}>保存</button>
        <div className="dropdown">
          <button className="dropdown-trigger" disabled={isExporting}>
            📜 テンプレート
          </button>
          <div className="dropdown-content">
            {templates.map((template) => (
              <button
                key={template.name}
                onClick={() => onSelectTemplate(template.path)}
                disabled={isExporting}
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>
        <div className="dropdown">
          <button className="dropdown-trigger" disabled={isExporting}>
            {isExporting ? '⏳' : '📥'} エクスポート
          </button>
          <div className="dropdown-content">
            <button onClick={() => handleExport('pptx')} disabled={isExporting}>
              PowerPoint (.pptx)
            </button>
            <button onClick={() => handleExport('html')} disabled={isExporting}>
              HTML (.html)
            </button>
            <button onClick={() => handleExport('png')} disabled={isExporting}>
              画像 (.png)
            </button>
          </div>
        </div>
        <button className="theme-toggle" onClick={onThemeToggle} disabled={isExporting}>
          {theme === 'dark' ? '🌙' : '☀️'} テーマ切替
        </button>
      </div>
    </header>
  );
};

export default Header;
