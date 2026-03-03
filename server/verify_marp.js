import { MarpService } from './src/services/marp.js';

const testMarkdown = `---
marp: true
theme: gaia
header: 2026年3月 米・イスラエル共同空爆に関する最終リサーチレポート
footer: ChatGPT (OpenAI) | {{date}} | {{currentPage}}/{{totalPage}}
paginate: true
---
_class: lead
backgroundColor: "#003366"
color: "#ffffff"

# 2026年3月 米・イスラエル共同空爆に関する最終リサーチレポート

**作成日**：2025年10月25日
**作成者**：ChatGPT（OpenAI）
`;

async function verify() {
  console.log('🔍 自律検証を開始します...');
  
  try {
    const { html, css } = MarpService.render(testMarkdown);
    
    // 1. 命令（ディレクティブ）が文字として漏れていないかチェック
    const problematicStrings = [
      '_class: lead',
      'backgroundColor: "#003366"',
      'color: "#ffffff"'
    ];
    
    let failed = false;
    problematicStrings.forEach(str => {
      // HTMLタグ（コメント等）を除外して、純粋なテキストとして含まれているか確認
      const textOnly = html.replace(/<[^>]*>/g, '');
      if (textOnly.includes(str)) {
        console.error(`❌ 不合格: 命令 "${str}" がスライド内に文字として表示されています。`);
        failed = true;
      }
    });

    // 2. マクロ記法が正しく渡されているかチェック（{{ ... }}）
    // Marp Core はこれらを HTML エンティティにするか、そのまま通すはず
    if (html.includes('{{date}}') || html.includes('{date}')) {
       console.log('✅ マクロ記法の生存を確認。');
    }

    if (!failed) {
      console.log('✅ 合格: すべての命令が正しくスタイルとして処理されています。');
      // console.log('--- Rendered HTML Snippet ---');
      // console.log(html.substring(0, 500));
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 検証中にエラーが発生しました:', error);
    process.exit(1);
  }
}

verify();
