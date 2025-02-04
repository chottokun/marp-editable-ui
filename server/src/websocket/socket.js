import { MarpService } from '../services/marp.js';

export function setupWebSocket(io) {
  io.on('connection', (socket) => {
    console.log('クライアント接続:', socket.id);

    // エディタの内容が変更された時
    socket.on('content-change', (content) => {
      try {
        const { html, css } = MarpService.render(content);
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

  return io;
}
