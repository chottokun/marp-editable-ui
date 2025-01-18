<p align="center">
  <img src="assets/header.svg" alt="Marp Editable Slides">
</p>

# 🎯 Marpスライド閲覧・共有プラットフォーム

このプロジェクトは、[Marp](https://marp.app/)で作成したスライドをWeb上で簡単に閲覧・ダウンロードできるプラットフォームです。

## 🚀 特徴

- 📱 モダンなWEBインターフェース
- 🔄 スライドのリアルタイムプレビュー
- 💾 各種形式でのダウンロード対応（PDF, PPTX）
- 🌐 ブラウザベースで簡単アクセス
- 🎨 レスポンシブデザイン
- 🌙 ダーク/ライトモード対応

## 📁 プロジェクト構成

```plaintext
marp-editable-ui/
├─ client/               # フロントエンド（React + TypeScript）
│  ├─ src/
│  │  ├─ components/    # UIコンポーネント
│  │  │  ├─ Editor/     # スライドビューア
│  │  │  ├─ Header/     # ヘッダーメニュー
│  │  │  └─ Preview/    # スライドプレビュー
│  │  └─ styles/        # UIスタイル
├─ server/               # バックエンド（Node.js + Express）
│  └─ index.js          # サーバーロジック
└─ src/                 # 共通リソース
   └─ public/           # 静的ファイル
```

## 🛠️ 開発環境のセットアップ

### 依存関係のインストール

```bash
# すべての依存関係をインストール
npm run install-all
```

### LibreOfficeのインストール（PowerPoint出力用）

PowerPoint形式（.pptx）でのダウンロードを有効にするには：

1. [Vector（窓の杜）からLibreOfficeをダウンロード](https://forest.watch.impress.co.jp/library/software/libreoffice/)
2. インストーラーを実行
3. デフォルト設定でインストール

※ LibreOfficeは.pptx形式の出力にのみ必要です。PDF出力は LibreOffice なしで可能です。

## 💫 使用方法

### アプリケーションの起動

```bash
# 開発サーバーの起動
npm run dev

# 本番環境用ビルド
npm run build
```

### スライド閲覧

1. ブラウザで [http://localhost:5173](http://localhost:5173) にアクセス
2. アップロードされたスライドを閲覧
3. 必要に応じて各種形式でダウンロード

### 機能一覧

- **プレビュー**: スライドをブラウザ上でリアルタイムに閲覧
- **ダウンロード**: PDF・PowerPoint形式でダウンロード可能
- **テーマ切替**: ダーク/ライトモードの切り替えに対応
- **レスポンシブ**: モバイルデバイスにも最適化された表示

## 🔧 技術スタック

- **フロントエンド**:
  - React + TypeScript
  - Vite
  - Socket.IO Client
  - Mantine UI

- **バックエンド**:
  - Node.js + Express
  - Marpit（Markdownレンダリング）
  - Socket.IO

## 📄 ライセンス

MIT License

## 🤝 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成
3. 変更をコミット
4. ブランチにプッシュ
5. プルリクエストを作成

## ⭐ スター付けのお願い

このプロジェクトが気に入りましたら、GitHubスターをつけていただけると嬉しいです！
