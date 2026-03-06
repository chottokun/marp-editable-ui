import { FC, useState } from 'react';
import './styles.css';

interface AiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyMarkdown: (markdown: string) => void;
  currentMarkdown: string;
}

/** Layout preset definitions */
const LAYOUT_PRESETS = [
  { label: '🌙 全スライド反転', instruction: '全てのスライドに class: invert を適用して、ダークテーマにしてください。' },
  { label: '🎯 タイトルスライド', instruction: '1枚目のスライドを class: lead にして、タイトルスライドとして強調してください。' },
  { label: '🏔️ Gaia テーマ', instruction: 'テーマを gaia に変更してください。配色もテーマに合わせて調整してください。' },
  { label: '🎭 Uncover テーマ', instruction: 'テーマを uncover に変更してください。' },
  { label: '📄 ページ番号追加', instruction: 'paginate: true を設定して、全スライドにページ番号を表示してください。' },
];

/** Content preset definitions */
const CONTENT_PRESETS = [
  { label: '📊 表を挿入', instruction: '内容に関連する比較表やデータ表をMarkdownのテーブル形式で追加してください。ヘッダー行とデータ行を含めてください。' },
  { label: '🔀 フローチャート', instruction: 'Mermaidのフローチャート（```mermaid\\nflowchart TD\\n...\\n```）を使って、内容に関連するフロー図を追加してください。' },
  { label: '🔄 シーケンス図', instruction: 'Mermaidのシーケンス図（```mermaid\\nsequenceDiagram\\n...\\n```）を使って、内容に関連するシーケンス図を追加してください。' },
  { label: '📐 数式', instruction: 'KaTeXの数式（$...$ や $$...$$）を使って、内容に関連する数式を追加してください。' },
  { label: '🖼️ 画像レイアウト', instruction: 'Marpの画像構文（![bg right:40%](url) や ![w:500](url)）を使って、スライドのレイアウトを改善してください。' },
];

const AiAssistant: FC<AiAssistantProps> = ({ isOpen, onClose, onApplyMarkdown, currentMarkdown }) => {
  const [prompt, setPrompt] = useState('');
  const [instruction, setInstruction] = useState('');
  const [slideCount, setSlideCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'optimize'>('generate');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt) return;
    try {
      setLoading(true);
      const response = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, slideCount }),
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
          slideCount
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

  const handlePresetClick = (presetInstruction: string) => {
    setInstruction(presetInstruction);
    setActiveTab('optimize');
  };

  return (
    <div className="ai-assistant-overlay">
      <div className="ai-assistant-modal">
        <div className="ai-assistant-header">
          <h2>🤖 AI Assistant</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="ai-assistant-content">
          {/* Slide count setting */}
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

          {/* Tab navigation */}
          <div className="ai-tabs">
            <button
              className={`ai-tab ${activeTab === 'generate' ? 'active' : ''}`}
              onClick={() => setActiveTab('generate')}
            >
              ✨ 新規生成
            </button>
            <button
              className={`ai-tab ${activeTab === 'optimize' ? 'active' : ''}`}
              onClick={() => setActiveTab('optimize')}
            >
              🎨 最適化・編集
            </button>
          </div>

          {/* Generate tab */}
          {activeTab === 'generate' && (
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
          )}

          {/* Optimize tab */}
          {activeTab === 'optimize' && (
            <div className="ai-assistant-section">
              <h3>🎨 現在のスライドを最適化</h3>

              {/* Layout Presets */}
              <div className="preset-group">
                <h4>📐 レイアウトプリセット</h4>
                <div className="preset-buttons">
                  {LAYOUT_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      className="preset-button"
                      onClick={() => handlePresetClick(preset.instruction)}
                      disabled={loading}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Presets */}
              <div className="preset-group">
                <h4>📝 コンテンツプリセット</h4>
                <div className="preset-buttons">
                  {CONTENT_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      className="preset-button content-preset"
                      onClick={() => handlePresetClick(preset.instruction)}
                      disabled={loading}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                placeholder="どのように改善したいですか？ (例: 'もっとモダンな配色にして') プリセットボタンで自動入力もできます。"
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
          )}

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
