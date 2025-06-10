FROM node:23.7.0-bookworm-slim

# システムパッケージの更新とLibreOfficeおよびChromiumのインストール
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    libreoffice-impress \
    fonts-dejavu \
    fonts-liberation \
    fontconfig \
    curl \
    chromium \
    libgconf-2-4 \
    libxss1 \
    libxtst6 \
    && rm -rf /var/lib/apt/lists/*

# ChromiumをMarp CLIのブラウザとして設定
ENV CHROME_PATH=/usr/bin/chromium
ENV CHROME_CANARY_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

# 全ソースコードをコピー
COPY . .

# 依存関係のインストール
RUN npm install && \
    cd client && npm install && \
    cd ../server && npm install

# Viteサーバーをホストから接続可能にする
ENV HOST=0.0.0.0

EXPOSE 5173

CMD ["npm", "run", "dev"]
