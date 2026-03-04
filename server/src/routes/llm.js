import express from 'express';
import { LlmService } from '../services/llm.js';

const router = express.Router();

// AIによるスライド生成エンドポイント
router.post('/generate', async (req, res) => {
  try {
    const { prompt, slideCount } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'プロンプトが必要です' });
    }
    const markdown = await LlmService.generate(prompt, slideCount);
    res.json({ markdown });
  } catch (error) {
    console.error('AI生成エラー:', error);
    res.status(500).json({
      error: 'AIによるスライド生成中にエラーが発生しました',
      details: error.message
    });
  }
});

// AIによるスライド最適化エンドポイント
router.post('/optimize', async (req, res) => {
  try {
    const { markdown, instruction, slideCount } = req.body;
    if (!markdown) {
      return res.status(400).json({ error: 'マークダウンが必要です' });
    }
    const optimizedMarkdown = await LlmService.optimize(markdown, instruction, slideCount);
    res.json({ markdown: optimizedMarkdown });
  } catch (error) {
    console.error('AI最適化エラー:', error);
    res.status(500).json({
      error: 'AIによるスライド最適化中にエラーが発生しました',
      details: error.message
    });
  }
});

export default router;
