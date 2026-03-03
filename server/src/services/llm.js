import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

export class LlmService {
  static async generate(prompt) {
    console.log('🤖 AIスライド生成を開始します...', { prompt });

    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

    if (!apiKey) {
      console.log('⚠️ GEMINI_API_KEYが設定されていないため、モックデータを返します');
      return this.getMockData(prompt);
    }

    try {
      const model = new ChatGoogleGenerativeAI({
        modelName: modelName,
        apiKey: apiKey,
        temperature: 0.7,
      });

      const template = PromptTemplate.fromTemplate(`
        あなたはプロのプレゼンテーションデザイナーです。
        以下のテーマに基づいて、Marp（Markdown Presentation Ecosystem）形式のスライドを作成してください。

        テーマ: {prompt}

        要件:
        - Marpのディレクティブ（--- marp: true --- など）を含めること
        - 日本語で作成すること
        - 5枚から8枚程度の構成にすること
        - 視覚的に分かりやすく、適切な見出し、箇条書き、強調を使用すること
        - コードブロックや引用なども必要に応じて使用すること

        出力はMarkdown形式のみとしてください。
      `);

      const chain = template.pipe(model).pipe(new StringOutputParser());
      const result = await chain.invoke({ prompt });

      return result;
    } catch (error) {
      console.error('AI生成エラー:', error);
      throw new Error(`AIによるスライド生成に失敗しました: ${error.message}`);
    }
  }

  static async optimize(markdown) {
    console.log('🤖 AIスライド最適化を開始します...');

    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

    if (!apiKey) {
      console.log('⚠️ GEMINI_API_KEYが設定されていないため、モックデータを返します');
      return markdown + "\n\n<!-- AIにより最適化されました（Mock） -->";
    }

    try {
      const model = new ChatGoogleGenerativeAI({
        modelName: modelName,
        apiKey: apiKey,
        temperature: 0.5,
      });

      const template = PromptTemplate.fromTemplate(`
        以下のMarp形式のマークダウンを改善してください。
        内容をより簡潔にし、プレゼンテーションとして魅力的な表現に修正してください。

        対象マークダウン:
        {markdown}

        要件:
        - Marpの構造を維持すること
        - 日本語で出力すること
        - 改善したMarkdownのみを出力すること
      `);

      const chain = template.pipe(model).pipe(new StringOutputParser());
      const result = await chain.invoke({ markdown });

      return result;
    } catch (error) {
      console.error('AI最適化エラー:', error);
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
- GEMINI_API_KEYを設定すると、本物のAIによる生成が可能です

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
