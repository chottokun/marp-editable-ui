import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

export class LlmService {
  /**
   * 使用するチャットモデルを取得する
   */
  static getChatModel(temperature = 0.7) {
    const provider = process.env.LLM_PROVIDER || 'google'; // デフォルトは google
    
    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      console.log('🤖 OpenAI を使用します');
      const modelName = process.env.OPENAI_MODEL || "gpt-4o";
      return new ChatOpenAI({
        model: modelName,
        modelName: modelName,
        apiKey: process.env.OPENAI_API_KEY,
        temperature,
      });
    }

    if (process.env.GEMINI_API_KEY) {
      console.log('🤖 Google Gemini を使用します');
      const apiKey = process.env.GEMINI_API_KEY.trim();
      const modelName = String(process.env.GEMINI_MODEL || "gemini-1.5-flash");
      
      return new ChatGoogleGenerativeAI({
        model: modelName,
        modelName: modelName,
        apiKey: apiKey,
        temperature,
      });
    }

    return null;
  }

  static async generate(prompt) {
    console.log('🤖 AIスライド生成を開始します...', { prompt });

    try {
      const model = this.getChatModel(0.7);

      if (!model) {
        console.log('⚠️ APIキーが設定されていないため、モックデータを返します');
        return this.getMockData(prompt);
      }

      console.log('📡 LangChain チェーンを実行中...');
      const template = PromptTemplate.fromTemplate(`
        あなたはプロのプレゼンテーションデザイナーです。
        以下のテーマに基づいて、視覚的に美しく、バリエーション豊かなMarp（Markdown Presentation Ecosystem）形式のスライドを作成してください。

        テーマ: {prompt}

        デザイン要件:
        - テーマは内容に合わせて 'default', 'gaia', 'uncover' から最適なものを選択すること
        - 【重要】HTMLコメント（<!-- ... -->）は出力に含めないでください。
        - Marpの高度な機能（ディレクティブ）を正しく使用すること:
          - 【重要】ファイル冒頭に \`marp: true\` を含むフロントマターを必ず記述してください。
          - 【重要】各スライドは必ず \`---\` で区切り、その直後の行から命令（_class等）を記述してください。
          - 【重要】空行、コメント、余計な文字を \`---\` と命令の間に絶対に入れないでください。
          - 【例】
            ---
            marp: true
            theme: gaia
            ---
            _class: lead
            backgroundColor: "#00796b"
            color: "#ffffff"

            # タイトル

            ---
            _class: invert

            # 次のスライド
          - \`_class: lead\` (中央揃えのインパクトあるスライド)

          - \`_class: invert\` (色の反転)
          - \`backgroundColor\`, \`color\` による背景・文字色のカスタマイズ
          - \`backgroundImage: url('...')\` (プレースホルダ画像を利用)
          - \`header\`, \`footer\`, \`paginate: true\` の活用
        - 【重要】引用符には全角や特殊な文字（‘, ’, “, ”）を絶対に使用せず、必ず標準的な半角（', "）のみを使用してください。
        - 必要に応じてHTMLタグ（<div style="...">など）を使用して、より複雑なレイアウト（左右分割など）を模倣すること

        構成要件:
        - 日本語で作成すること
        - 6枚から10枚程度の構成にすること
        - 専門的かつ分かりやすい内容にすること

        出力はMarkdown形式のみとし、\`\`\`markdown などの囲み記号は一切含めないでください。
      `);

      const chain = template.pipe(model).pipe(new StringOutputParser());
      let result = await chain.invoke({ prompt });
      console.log('✅ AI生成が完了しました。文字数:', result.length);

      // 不要なコードブロック記号を除去
      result = result.replace(/^```markdown\n/, '').replace(/^```\n?/, '').replace(/\n```$/, '');

      // HTMLコメント（<!-- ... -->）を削除（Marpの解析を妨げるため）
      result = result.replace(/<!--[\s\S]*?-->/g, '');

      // 特殊な引用符・装飾引用符をすべて標準的な半角に置換
      // さまざまな種類の引用符（全角、スマートクオート等）を網羅
      result = result
        .replace(/[\u2018\u2019\u201A\u201B\u2039\u203A\u300C\u300D]/g, "'")
        .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB\u300E\u300F]/g, '"');

      // スライド区切り(---)の直後の空行を削除してディレクティブを確実に先頭にする
      result = result.replace(/^---\s*\n\s*\n/gm, '---\n');

      // 冒頭に --- がない場合、強制的に挿入（フロントマターを有効にするため）
      if (!result.trim().startsWith('---')) {
        result = '---\n' + result.trim();
      }

      return result;
    } catch (error) {
      console.error('❌ AI生成エラー詳細:', error);
      if (error.stack) console.error(error.stack);
      throw new Error(`AIによるスライド生成に失敗しました: ${error.message}`);
    }
  }

  static async optimize(markdown) {
    console.log('🤖 AIスライド最適化を開始します...');

    try {
      const model = this.getChatModel(0.5);

      if (!model) {
        console.log('⚠️ APIキーが設定されていないため、モックデータを返します');
        return markdown + "\n\n<!-- AIにより最適化されました（Mock） -->";
      }

      console.log('📡 LangChain チェーン（最適化）を実行中...');
      const template = PromptTemplate.fromTemplate(`
        以下のMarp形式のマークダウンをプロのプレゼンテーションデザイナーとして改善してください。
        内容をより簡潔にし、視覚的に訴求力のあるデザイン（Marpの機能を駆使）に修正してください。

        対象マークダウン:
        {markdown}

        改善要件:
        - 視覚的なバリエーションを増やすこと（_class, backgroundColor, backgroundImageの適切な挿入）
        - 【重要】ディレクティブは必ずスライドの区切り（---）の直後、スライドの最上部に記述してください。
        - 情報を構造化し、プレゼンテーションとしてインパクトのある構成にすること
        - 日本語で出力すること
        - 【重要】引用符には全角や特殊な文字（‘, ’, “, ”）を絶対に使用せず、必ず標準的な半角（', "）のみを使用してください。
        - 出力は改善したMarkdown形式のみとし、\`\`\`markdown などの囲み記号は一切含めないでください。
      `);

      const chain = template.pipe(model).pipe(new StringOutputParser());
      let result = await chain.invoke({ markdown });
      console.log('✅ AI最適化が完了しました。文字数:', result.length);

      // 不要なコードブロック記号を除去
      result = result.replace(/^```markdown\n/, '').replace(/^```\n?/, '').replace(/\n```$/, '');

      // HTMLコメント（<!-- ... -->）を削除
      result = result.replace(/<!--[\s\S]*?-->/g, '');

      // 特殊な引用符・装飾引用符をすべて標準的な半角に置換
      result = result
        .replace(/[\u2018\u2019\u201A\u201B\u2039\u203A\u300C\u300D]/g, "'")
        .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB\u300E\u300F]/g, '"');

      // スライド区切り(---)の直後の空行を削除
      result = result.replace(/^---\s*\n\s*\n/gm, '---\n');

      // 冒頭に --- がない場合、強制的に挿入（フロントマターを有効にするため）
      if (!result.trim().startsWith('---')) {
        result = '---\n' + result.trim();
      }

      return result;
    } catch (error) {
      console.error('❌ AI最適化エラー詳細:', error);
      if (error.stack) console.error(error.stack);
      throw new Error(`AIによるスライド最適化に失敗しました: ${error.message}`);
    }
  }

  static getMockData(prompt) {
    return `---
marp: true
theme: default
paginate: true
---

# ${prompt}

## プレゼンテーションの概要
- AIによって生成されたサンプルスライドです
- GEMINI_API_KEY または OPENAI_API_KEY を設定すると、本物のAIによる生成が可能です

---

## 主要なポイント
1. 効率的なスライド作成
2. インタラクティブな編集
3. 多彩なエクスポート形式

---

## まとめ
- Marp Editable UIで快適なプレゼン作成を
- ご清聴ありがとうございました
`;
  }
}
