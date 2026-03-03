import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import { config } from './config/app.js';
import apiRoutes from './routes/api.js';
import llmRoutes from './routes/llm.js';
import { setupWebSocket } from './websocket/socket.js';
import { errorHandler, setupErrorHandlers, notFoundHandler } from './middleware/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Expressアプリケーションの設定
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, config.cors);

// ミドルウェアの設定
// CORSの設定
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// ルーティングの設定
app.use('/api', apiRoutes);
app.use('/api/llm', llmRoutes);

// WebSocketの設定
setupWebSocket(io);

// エラーハンドリングの設定
app.use(notFoundHandler);
app.use(errorHandler);
setupErrorHandlers();

// サーバーの起動
httpServer.listen(config.port, () => {
  console.log('===================================');
  console.log('🚀 Marpサーバーが起動しました');
  console.log('-----------------------------------');
  console.log(`📡 API エンドポイント: http://localhost:${config.port}`);
  console.log(`🔌 WebSocket接続: ws://localhost:${config.port}`);
  console.log(`🛠️  実行環境: ${process.env.NODE_ENV || 'development'}`);
  console.log('===================================');
});
