FROM node:20-alpine

# システムの依存関係をインストール（開発環境用の最小セット）
RUN apk add --no-cache \
    chromium \
    chromium-chromedriver \
    libreoffice \
    harfbuzz \
    nss \
    freetype \
    ttf-freefont

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonファイルをコピー
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# 依存関係をインストール
RUN npm install && \
    cd client && npm install && \
    cd ../server && npm install && \
    npm install -g @marp-team/marp-cli

# ソースコードをコピー
COPY . .

# 環境変数を設定
ENV NODE_ENV=development
ENV PORT=3001
ENV SOCKET_PORT=3001
ENV CHROME_PATH=/usr/bin/chromium-browser
ENV CHROME_ARGS="--no-sandbox,--disable-dev-shm-usage"

# データディレクトリを作成
RUN mkdir -p /app/data /tmp/slides && \
    chmod -R 777 /app/data /tmp/slides

# ポートを公開（Viteのポートとバックエンドのポート）
EXPOSE 5173 3001

# 開発サーバーを起動
CMD ["npm", "run", "dev"]
