import { FC, useState } from 'react';
import './styles.css';

interface AiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyMarkdown: (markdown: string) => void;
  currentMarkdown: string;
}

const AiAssistant: FC<AiAssistantProps> = ({ isOpen, onClose, onApplyMarkdown, currentMarkdown }) => {
  const [prompt, setPrompt] = useState('');
  const [instruction, setInstruction] = useState('');
  const [slideCount, setSlideCount] = useState(5); // デフォルト5枚
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt) return;
    try {
      setLoading(true);
      const response = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          slideCount // 枚数を送信
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (data.markdown) {
        setResult(data.markdown);
      }
    } catch (error) {
      console.error('AI generation error:', error);
      alert(`AIによる生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/llm/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          markdown: currentMarkdown,
          instruction: instruction,
          slideCount // 最適化後の枚数も指定可能に
        }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (data.markdown) {
        setResult(data.markdown);
      }
    } catch (error) {
      console.error('AI optimization error:', error);
      alert(`AIによる最適化に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApplyMarkdown(result);
      setResult(null);
      onClose();
    }
  };

  return (
    <div className="ai-assistant-overlay">
      <div className="ai-assistant-modal">
        <div className="ai-assistant-header">
          <h2>🤖 AI Assistant</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="ai-assistant-content">
          <div className="ai-settings-row">
            <label>スライド枚数:</label>
            <input 
              type="number" 
              min="1" 
              max="20" 
              value={slideCount}
              onChange={(e) => setSlideCount(parseInt(e.target.value) || 5)}
              className="slide-count-input"
            />
            <span className="unit">枚</span>
          </div>

          <div className="ai-assistant-divider-line" />

          <div className="ai-assistant-section">
            <h3>✨ スライドを新規生成</h3>
            <textarea
              placeholder="プレゼンのテーマを入力してください (例: 'TypeScriptの基礎')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              className="ai-textarea"
            />
            <button
              className="generate-button"
              onClick={handleGenerate}
              disabled={loading || !prompt}
            >
              {loading ? '生成中...' : 'AIでスライドを生成'}
            </button>
          </div>

          <div className="ai-assistant-divider">or</div>

          <div className="ai-assistant-section">
            <h3>🎨 現在のスライドを最適化</h3>
            <textarea
              placeholder="どのように改善したいですか？ (例: 'もっとモダンな配色にして')"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              disabled={loading}
              className="ai-textarea"
            />
            <button
              className="optimize-button"
              onClick={handleOptimize}
              disabled={loading}
            >
              {loading ? '最適化中...' : 'AIで内容をブラッシュアップ'}
            </button>
          </div>

          {result && (
            <div className="ai-assistant-result">
              <h3>✨ 生成結果のプレビュー</h3>
              <pre className="result-preview">{result}</pre>
              <button className="apply-button" onClick={handleApply}>
                エディタに適用する
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
