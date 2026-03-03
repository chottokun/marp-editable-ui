import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Header from './components/Header';
import Editor from './components/Editor';
import Preview from './components/Preview';
import AiAssistant from './components/AiAssistant';
import './styles/global.css';
import './styles/theme.css';

const socket = io(`http://${window.location.hostname}:3001`);

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

  // マークダウンをレンダリング
  const renderMarkdown = async (markdown: string) => {
    try {
      const response = await fetch(`http://${window.location.hostname}:3001/api/render`, {
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

    return () => {
      socket.off('connect');
      socket.off('content-update');
      socket.off('render-error');
    };
  }, []);

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
    <div className={`app theme-${theme}`}>
      <Header
        theme={theme}
        content={content}
        onNewFile={() => setContent(initialContent)}
        onSaveFile={handleSaveFile}
        onThemeToggle={toggleTheme}
        onAiAssistantOpen={() => setIsAiOpen(true)}
      />

      <div className="container">
        <Editor
          content={content}
          theme={theme}
          onChange={handleChange}
        />
        
        <Preview
          html={preview.html}
          css={preview.css}
          error={error}
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
