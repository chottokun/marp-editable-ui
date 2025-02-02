FROM node:20-alpine as base

WORKDIR /app

# package.jsonをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm install

# 開発環境
FROM base as development
ENV NODE_ENV=development
ENV VITE_API_URL=http://localhost:3001

# TypeScriptとViteの設定ファイルをコピー
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY eslint.config.js ./

# ソースコードをコピー
COPY src/ src/
COPY public/ public/
COPY index.html ./

# 開発サーバーの起動
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# ビルド環境
FROM base as build
ENV NODE_ENV=production
ENV VITE_API_URL=http://localhost:3001

# TypeScriptとViteの設定ファイルをコピー
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY eslint.config.js ./

# ソースコードをコピー
COPY src/ src/
COPY public/ public/
COPY index.html ./

# アプリケーションのビルド
RUN npm run build

# 本番環境
FROM nginx:alpine as production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginxの設定
RUN mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx && \
    mkdir -p /var/log/nginx && \
    chown -R nginx:nginx /var/log/nginx

# ヘルスチェック用の設定
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget -q --spider http://localhost:80/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
