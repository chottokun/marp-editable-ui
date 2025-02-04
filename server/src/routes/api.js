import express from 'express';
import { MarpService } from '../services/marp.js';
import { cleanupTempFiles } from '../utils/temp.js';
import { config } from '../config/app.js';

const router = express.Router();

// マークダウンのレンダリングエンドポイント
router.post('/render', (req, res) => {
  try {
    const { html, css } = MarpService.render(req.body.markdown);
    res.json({ html, css });
  } catch (error) {
    console.error('レンダリングエラー:', error);
    res.status(500).json({ 
      error: 'レンダリングエラーが発生しました',
      details: error.message 
    });
  }
});

// エクスポートエンドポイント
router.post('/export', async (req, res) => {
  const { markdown, format } = req.body;
  let tmpDir;

  try {
    const output = await MarpService.export(markdown, format);
    
    // Content-Typeの設定
    res.setHeader('Content-Type', config.contentTypes[format]);
    res.setHeader('Content-Disposition', `attachment; filename=presentation.${format}`);
    res.send(output);

  } catch (error) {
    // エラー情報の詳細なログ出力
    console.error('エクスポートエラー:', {
      error: error.message,
      stack: error.stack,
      format,
      tmpDir: tmpDir || 'Not created',
      requestBody: {
        format,
        markdownLength: markdown?.length || 0
      }
    });

    // エラーの種類に応じて適切なステータスコードとメッセージを設定
    let statusCode = 500;
    let errorResponse = {
      error: 'エクスポート中にエラーが発生しました',
      details: error.message,
      format,
      timestamp: new Date().toISOString()
    };

    if (error.message.includes('入力ファイルが見つかりません')) {
      statusCode = 400;
      errorResponse.error = '入力ファイルの作成に失敗しました';
    } else if (error.message.includes('出力ファイルが生成されませんでした')) {
      statusCode = 500;
      errorResponse.error = 'ファイルの生成に失敗しました';
    } else if (error.message.includes('Marpのエクスポート処理に失敗しました')) {
      errorResponse.error = 'Marpによるファイル変換に失敗しました';
      errorResponse.details = error.message.replace('Marpのエクスポート処理に失敗しました: ', '');
    }

    res.status(statusCode).json(errorResponse);
  } finally {
    // 一時ファイルの削除
    if (tmpDir) {
      await cleanupTempFiles(tmpDir);
    }
  }
});

export default router;
