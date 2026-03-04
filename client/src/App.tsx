import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useMediaQuery } from '@mantine/hooks';
import Header from './components/Header';
import Editor from './components/Editor';
import Preview from './components/Preview';
import AiAssistant from './components/AiAssistant';
import './styles/global.css';
import './styles/theme.css';

const socket = io('http://127.0.0.1:3001');

const initialContent = `---
marp: true
theme: default
---

# ✨ Marp Editable Slides Demo

### モダンなリアルタイムスライドエディタ

---

## 💫 特徴

- リアルタイムプレビュー
- グラスモーフィズムUI
- マークダウン構文ハイライト
- 自動保存機能

---

## 🎨 スタイリングの例

\`\`\`css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
\`\`\`

---

## 📝 使い方

1. 左側のエディタでMarpマークダウンを編集
2. 右側でリアルタイムプレビューを確認
3. 必要に応じてファイルとして保存

> デモスライドをお楽しみください！
`;

function App() {
  const [content, setContent] = useState(initialContent);
  const [preview, setPreview] = useState({ html: '', css: '' });
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'warm'>('warm');
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [editorWidth, setEditorWidth] = useState(50); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // マークダウンをレンダリング
  const renderMarkdown = async (markdown: string) => {
    try {
      const apiUrl = 'http://127.0.0.1:3001';
      const response = await fetch(`${apiUrl}/api/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markdown }),
      });
      
      if (!response.ok) {
        throw new Error('レンダリングに失敗しました');
      }

      const result = await response.json();
      setPreview(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    }
  };

  // エディタの内容が変更された時の処理
  const handleChange = (value: string) => {
    setContent(value);
    socket.emit('content-change', value);
    renderMarkdown(value);
  };

  // ファイルの保存
  const handleSaveFile = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presentation.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - containerRect.left;
      const newWidth = (relativeX / containerRect.width) * 100;
      
      if (newWidth > 15 && newWidth < 85) {
        setEditorWidth(newWidth);
      }
    }
  }, [isResizing]);

  // WebSocket接続の設定
  useEffect(() => {
    socket.on('connect', () => {
      console.log('サーバーに接続しました');
    });

    socket.on('content-update', (data) => {
      setPreview(data);
    });

    socket.on('render-error', (data) => {
      setError(data.message);
    });

    // 初期レンダリング
    renderMarkdown(initialContent);

    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);

    return () => {
      socket.off('connect');
      socket.off('content-update');
      socket.off('render-error');
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  // テーマの切り替え
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'warm' : 'dark');
    document.body.className = theme === 'dark' ? 'theme-warm' : 'theme-dark';
  };

  // AIアシスタントからの適用
  const handleApplyAiMarkdown = (markdown: string) => {
    setContent(markdown);
    renderMarkdown(markdown);
  };

  return (
    <div className={`app theme-${theme} ${isResizing ? 'is-resizing' : ''}`}>
      <Header
        theme={theme}
        content={content}
        onNewFile={() => setContent(initialContent)}
        onSaveFile={handleSaveFile}
        onThemeToggle={toggleTheme}
        onAiAssistantOpen={() => setIsAiOpen(true)}
      />

      <div className="container" ref={containerRef}>
        <Editor
          content={content}
          theme={theme}
          onChange={handleChange}
          style={!isMobile ? { width: `${editorWidth}%`, flex: 'none' } : {}}
        />
        
        <div 
          className={`resizer ${isResizing ? 'is-resizing' : ''}`} 
          onMouseDown={startResizing}
        />

        <Preview
          html={preview.html}
          css={preview.css}
          error={error}
          style={!isMobile ? { flex: 1 } : {}}
        />
      </div>

      <AiAssistant
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        onApplyMarkdown={handleApplyAiMarkdown}
        currentMarkdown={content}
      />
    </div>
  );
}

export default App;
