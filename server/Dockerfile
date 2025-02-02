FROM node:20-alpine

# システムの依存関係をインストール
RUN apk add --no-cache \
    chromium \
    chromium-chromedriver \
    libreoffice \
    harfbuzz \
    nss \
    freetype \
    ttf-freefont \
    font-noto \
    xvfb \
    bash \
    ghostscript \
    imagemagick

# 作業ディレクトリを設定
WORKDIR /app

# サーバーのpackage.jsonをコピー
COPY server/package.json server/
COPY server/package-lock.json server/

# serverディレクトリに移動して依存関係をインストール
WORKDIR /app/server
RUN npm install

# nodemonをグローバルにインストール
RUN npm install -g nodemon

# サーバーのソースコードをコピー
COPY server/index.js .

# 環境変数を設定
ENV NODE_ENV=development
ENV PORT=3001
ENV SOCKET_PORT=3001
ENV CHROME_PATH=/usr/bin/chromium-browser
ENV CHROME_ARGS="--no-sandbox,--disable-dev-shm-usage"

# データディレクトリを作成
RUN mkdir -p /app/data /tmp/slides

# 権限の設定
RUN chmod -R 777 /app/data /tmp/slides

# ポートを公開
EXPOSE 3001

# 開発サーバーを起動
CMD ["nodemon", "index.js"]
