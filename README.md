# Marp Editable UI

<div align="center">
  <img src="assets/header.png" alt="Marp Editable Slides">

  ## 🎯 Marpスライド編集・プレビュープラットフォーム

  [![Node.js Version](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white)](https://expressjs.com/)
  [![Docker](https://img.shields.io/badge/Docker-24.0-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat)](http://makeapullrequest.com)
</div>

## 🌟 特徴

- 📝 リアルタイムマークダウン編集
- 🔄 インスタントプレビュー
- 📊 複数形式でのエクスポート（PDF, PPTX, PNG）
- 🎨 カスタマイズ可能なテーマ
- 🌙 ダーク/ライトモード対応
- 📱 レスポンシブデザイン
- 🔌 WebSocket によるリアルタイム同期
- 🐳 Docker による簡単デプロイ

## 🛠️ 技術スタック

### フロントエンド
- React 18.3
- TypeScript 5.6
- Vite 6.0
- Mantine UI
- CodeMirror (コードエディタ)
- Socket.IO Client (リアルタイム通信)

### バックエンド
- Node.js 20
- Express 4.18
- Marp CLI / Marpit (スライド変換)
- Socket.IO (WebSocket)
- LibreOffice (PowerPoint変換)

### インフラ
- Docker
- Nginx
- Alpine Linux

## 📦 必要要件

- Node.js 20.x
- npm または yarn
- Docker & Docker Compose
- LibreOffice (PowerPointエクスポート用)

## 🚀 クイックスタート

### Docker を使用する場合

```bash
# リポジトリのクローン
git clone https://github.com/your-username/marp-editable-ui.git
cd marp-editable-ui

# コンテナのビルドと起動
docker-compose up --build
```

### ローカル環境での実行

1. 依存関係のインストール:
```bash
npm run install-all
```

2. 開発サーバーの起動:
```bash
npm run dev
```

3. ブラウザで以下のURLにアクセス:
- フロントエンド: http://localhost:5173
- バックエンドAPI: http://localhost:3001

## 📁 プロジェクト構成

```
marp-editable-ui/
├─ client/                 # フロントエンド
│  ├─ public/             # 静的ファイル
│  ├─ src/
│  │  ├─ components/      # Reactコンポーネント
│  │  │  ├─ Editor/       # マークダウンエディタ
│  │  │  ├─ Header/       # ヘッダーメニュー
│  │  │  └─ Preview/      # スライドプレビュー
│  │  ├─ styles/          # グローバルスタイル
│  │  └─ App.tsx          # メインアプリケーション
│  ├─ Dockerfile          # フロントエンドのDocker設定
│  └─ vite.config.ts      # Vite設定
├─ server/                 # バックエンド
│  ├─ index.js            # Express/Socket.IOサーバー
│  └─ Dockerfile          # バックエンドのDocker設定
└─ docker-compose.yml      # Docker Compose設定
```

## 💫 主な機能

### エディタ機能
- シンタックスハイライト
- 自動インデント
- リアルタイムプレビュー
- 行番号表示
- コードフォールディング

### プレビュー機能
- リアルタイム更新
- スライドのスケーリング
- エラー表示
- カスタムテーマ適用

### エクスポート機能
- PDF出力
- PowerPoint (PPTX) 出力
- PNG画像出力
- HTMLエクスポート

## 🔧 環境設定

### PowerPointエクスポート用のLibreOfficeセットアップ

#### Windows
1. [Vector（窓の杜）](https://forest.watch.impress.co.jp/library/software/libreoffice/)からLibreOfficeをダウンロード
2. インストーラーを実行
3. デフォルト設定でインストール

#### macOS
```bash
brew install --cask libreoffice
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install libreoffice
```

## 🌐 ネットワーク設定

デフォルトポート:
- フロントエンド: 5173
- バックエンド: 3001
- WebSocket: 3001

環境変数での設定変更が可能です:
```bash
# .env
VITE_API_URL=http://localhost:3001
PORT=3001
SOCKET_PORT=3001
```

## 🔒 セキュリティ考慮事項

- CORS設定済み
- WebSocketセキュリティ対策実装
- Nginxセキュリティヘッダー設定
- ファイルアップロード制限
- サニタイズ処理

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🙏 クレジット

- [Marp](https://marp.app/) - Markdownプレゼンテーションエコシステム
- [React](https://reactjs.org/) - UIライブラリ
- [Vite](https://vitejs.dev/) - フロントエンドツール
- [Express](https://expressjs.com/) - Node.jsウェブアプリケーションフレームワーク

## 📮 お問い合わせ

質問や提案がありましたら、Issueを作成するかプルリクエストを送信してください。
