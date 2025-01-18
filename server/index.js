const express = require('express');
const { Server } = require('socket.io');
const { createServer } = require('http');
const { Marpit } = require('@marp-team/marpit');
const cors = require('cors');
const path = require('path');

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

// サーバーの起動
const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Marpサーバーが起動しました: http://localhost:${PORT}`);
});
