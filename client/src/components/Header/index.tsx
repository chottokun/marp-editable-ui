import { FC } from 'react';
import './styles.css';

interface HeaderProps {
  theme: 'dark' | 'warm';
  onNewFile: () => void;
  onSaveFile: () => void;
  onThemeToggle: () => void;
}

const Header: FC<HeaderProps> = ({
  theme,
  onNewFile,
  onSaveFile,
  onThemeToggle
}) => {
  return (
    <header className="header">
      <h1>✨ Marp Editable Slides Demo</h1>
      <div className="toolbar">
        <button onClick={onNewFile}>新規</button>
        <button onClick={onSaveFile}>保存</button>
        <button className="theme-toggle" onClick={onThemeToggle}>
          {theme === 'dark' ? '🌙' : '☀️'} テーマ切替
        </button>
      </div>
    </header>
  );
};

export default Header;
