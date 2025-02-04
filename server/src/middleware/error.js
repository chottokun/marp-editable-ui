// グローバルエラーハンドラ
export const errorHandler = (err, req, res, next) => {
  console.error('エラー発生:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // エラーの種類に応じてステータスコードを設定
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    error: err.message || 'サーバーエラーが発生しました',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
};

// 未処理のPromise拒否をハンドル
export const setupErrorHandlers = () => {
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
};

// ルートが見つからない場合のハンドラ
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'リクエストされたリソースが見つかりません',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};
