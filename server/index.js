import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { Marpit } from '@marp-team/marpit';
import { marpCli } from '@marp-team/marp-cli';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Viteのデフォルトポート
    methods: ["GET", "POST"]
  }
});

// CORSを有効化
app.use(cors());
app.use(express.json());

// Marpitインスタンスの作成
const marpit = new Marpit({
  markdown: {
    html: true,
    breaks: true,
    linkify: true,
    typographer: true
  }
});

// デフォルトテーマの設定
marpit.themeSet.default = marpit.themeSet.add(`
/* @theme default */
section {
  width: 960px;
  height: 720px;
  font-size: 32px;
  padding: 40px;
  background: #fff;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

h1 {
  font-size: 60px;
  color: #09c;
  margin-bottom: 0.5em;
}

h2 {
  font-size: 48px;
  color: #333;
  margin-bottom: 0.5em;
}

h3 {
  font-size: 36px;
  color: #666;
  margin-bottom: 0.5em;
}

ul, ol {
  padding-left: 1.2em;
  line-height: 1.4;
}

li {
  margin-bottom: 0.5em;
}

code {
  background: #f0f0f0;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Courier New', Courier, monospace;
}

pre {
  background: #f5f5f5;
  padding: 1em;
  border-radius: 5px;
  margin: 1em 0;
}

pre code {
  background: none;
  padding: 0;
  border-radius: 0;
}

blockquote {
  border-left: 5px solid #09c;
  padding-left: 1em;
  color: #666;
  font-style: italic;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

th, td {
  border: 1px solid #ddd;
  padding: 0.5em;
  text-align: left;
}

th {
  background: #f0f0f0;
}
`);

// マークダウンのレンダリングエンドポイント
app.post('/api/render', (req, res) => {
  try {
    const { markdown } = req.body;
    if (!markdown) {
      return res.status(400).json({ error: 'マークダウンが提供されていません' });
    }

    const { html, css } = marpit.render(markdown);
    res.json({ html, css });
  } catch (error) {
    console.error('レンダリングエラー:', error);
    res.status(500).json({ 
      error: 'レンダリングエラーが発生しました',
      details: error.message 
    });
  }
});

// WebSocket接続の処理
io.on('connection', (socket) => {
  console.log('クライアント接続:', socket.id);

  // エディタの内容が変更された時
  socket.on('content-change', (content) => {
    try {
      const { html, css } = marpit.render(content);
      // 他のクライアントに変更を通知
      socket.broadcast.emit('content-update', { html, css });
    } catch (error) {
      console.error('リアルタイム更新エラー:', error);
      socket.emit('render-error', { 
        message: 'プレビューの更新に失敗しました',
        details: error.message 
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('クライアント切断:', socket.id);
  });
});

// 一時ファイルの作成
async function createTempFile(content, ext = '.md') {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'marp-'));
  const tmpFile = path.join(tmpDir, `slide${ext}`);
  await fs.writeFile(tmpFile, content);
  return { tmpDir, tmpFile };
}

// 一時ファイルの削除
async function cleanupTempFiles(tmpDir) {
  try {
    await fs.rm(tmpDir, { recursive: true });
  } catch (error) {
    console.error('一時ファイルの削除に失敗:', error);
  }
}

// ダウンロード用エンドポイント
app.post('/api/export', async (req, res) => {
  const { markdown, format } = req.body;
  if (!markdown || !format) {
    return res.status(400).json({ error: '必要なパラメータが不足しています' });
  }

  let tmpDir;
  try {
    // 一時ファイルの作成
    const { tmpDir: dir, tmpFile } = await createTempFile(markdown);
    tmpDir = dir;

    // Marp CLIオプションの設定
    const options = {
      input: tmpFile,
      output: path.join(tmpDir, `output.${format}`),
      allowLocalFiles: true,
      html: true
    };

    // 形式に応じた追加設定
    if (format === 'pptx') {
      options.pptx = true;
    } else if (format === 'png') {
      options.image = true;
      options.imageScale = 2; // 高解像度出力
    }

    console.log('エクスポート開始:', {
      format,
      tmpDir,
      input: options.input,
      output: options.output
    });

    // 一時ファイルの存在確認
    const inputExists = await fs.access(options.input)
      .then(() => true)
      .catch(() => false);
    
    if (!inputExists) {
      throw new Error(`入力ファイルが見つかりません: ${options.input}`);
    }

    // Marp CLIでファイル生成
    const cliArgs = [
      options.input,
      '-o', options.output,
      '--allow-local-files',
      '--html',
      ...(format === 'pptx' ? ['--pptx'] : []),
      ...(format === 'png' ? ['--image', '--image-scale', '2'] : [])
    ];

    console.log('Marp CLI実行:', {
      args: cliArgs,
      format,
      tmpDir,
      input: options.input,
      output: options.output
    });

    // CLIコマンド実行
    try {
      await marpCli(cliArgs);
    } catch (error) {
      console.error('Marp CLI実行エラー:', {
        error: error.message,
        stack: error.stack,
        args: cliArgs,
        format,
        tmpDir,
        input: options.input,
        output: options.output
      });
      throw new Error(`Marpのエクスポート処理に失敗しました: ${error.message}`);
    }

    // 出力ファイルの存在確認
    const outputExists = await fs.access(options.output)
      .then(() => true)
      .catch(() => false);

    if (!outputExists) {
      throw new Error(`出力ファイルが生成されませんでした: ${options.output}`);
    }

    // 生成されたファイルを読み込んでレスポンス
    const output = await fs.readFile(options.output);
    console.log('ファイル生成成功:', {
      format,
      size: output.length,
      outputPath: options.output
    });
    
    // Content-Typeの設定
    const contentTypes = {
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'html': 'text/html',
      'png': 'image/png'
    };
    
    res.setHeader('Content-Type', contentTypes[format]);
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

// サーバーの起動
const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log('===================================');
  console.log('🚀 Marpサーバーが起動しました');
  console.log('-----------------------------------');
  console.log(`📡 API エンドポイント: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket接続: ws://localhost:${PORT}`);
  console.log(`🛠️  実行環境: ${process.env.NODE_ENV || 'development'}`);
  console.log('===================================');
});

// 予期せぬエラーのハンドリング
process.on('uncaughtException', (error) => {
  console.error('予期せぬエラーが発生しました:', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未処理のPromise拒否が発生しました:', {
    reason,
    promise,
    timestamp: new Date().toISOString()
  });
});
