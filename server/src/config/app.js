import { Marp } from '@marp-team/marp-core';

// Marpit (Marp Core) インスタンスの設定
export const createMarpitInstance = () => {
  const marp = new Marp({
    inlineSVG: true,
    html: true,
    breaks: true,
    linkify: true,
    typographer: true
  });

  // デフォルトテーマの設定
  marp.themeSet.default = marp.themeSet.add(`
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
    font-size: 0.8em;
  }

  th, td {
    border: 1px solid #ddd;
    padding: 0.6em;
    text-align: left;
  }

  th {
    background: #f8f9fa;
    font-weight: bold;
  }

  tr:nth-child(even) {
    background: #fafafa;
  }

  /* Mermaidコンテナの調整 */
  .language-mermaid {
    background: transparent !important;
    padding: 0 !important;
    display: flex;
    justify-content: center;
    overflow: visible !important;
  }
  
  .language-mermaid svg {
    max-width: 100%;
    height: auto;
  }

  /* 数式の余白調整 */
  .katex-display {
    margin: 1em 0;
    overflow-x: auto;
    overflow-y: hidden;
  }
  `);

  return marp;
};

// サーバー設定
export const config = {
  port: process.env.PORT || 3001,
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
  contentTypes: {
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'html': 'text/html',
    'png': 'image/png'
  }
};
