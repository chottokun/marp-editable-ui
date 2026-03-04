import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

/**
 * スライド1枚の構造定義
 */
const SlideSchema = z.object({
  title: z.string().describe("スライドのタイトル。必ず簡潔で分かりやすいものにすること。"),
  content: z.string().describe("スライドの本文（マークダウン形式、箇条書き、強調などを活用）。"),
  style: z.object({
    class: z.enum(["lead", "invert", "default"]).optional().describe("スライドのクラス。中央揃えは lead、色反転は invert。"),
    backgroundColor: z.string().optional().describe("背景色 (例: #ffffff, #003366)。"),
    color: z.string().optional().describe("文字色 (例: #000000, #ffffff)。"),
    backgroundImage: z.string().optional().describe("背景画像URL。"),
  }).optional().describe("スライドごとの個別スタイル設定。"),
  header: z.string().optional().describe("このスライド専用のヘッダー。"),
  footer: z.string().optional().describe("このスライド専用のフッター。"),
});

/**
 * プレゼンテーション全体の構造定義
 */
const PresentationSchema = z.object({
  config: z.object({
    theme: z.enum(["default", "gaia", "uncover"]).describe("Marpの基本テーマ。"),
    paginate: z.boolean().describe("ページ番号を表示するかどうか。"),
    header: z.string().optional().describe("全スライド共通のヘッダー。"),
    footer: z.string().optional().describe("全スライド共通のフッター。"),
  }).describe("プレゼンテーションの全般設定。"),
  slides: z.array(SlideSchema).min(3).max(15).describe("スライドのリスト。"),
});

export class LlmService {
  /**
   * 構造化データをMarp Markdownに変換する
   */
  static renderStructuredToMarkdown(data) {
    if (!data || !data.slides) {
      throw new Error("構造化データが不正です。");
    }

    // 引用符の正規化（全角や装飾引用符を半角に置換）
    const normalize = (str) => {
      if (!str) return str;
      return str
        .replace(/[\u2018\u2019\u201A\u201B\u2039\u203A\u300C\u300D]/g, "'")
        .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB\u300E\u300F]/g, '"');
    };

    let md = "---\nmarp: true\n";
    md += `theme: ${data.config.theme || 'default'}\n`;
    if (data.config.paginate) md += "paginate: true\n";
    if (data.config.header) md += `header: "${normalize(data.config.header)}"\n`;
    if (data.config.footer) md += `footer: "${normalize(data.config.footer)}"\n`;
    md += "---\n\n";

    data.slides.forEach((slide, index) => {
      if (index > 0) md += "\n---\n\n";
      
      const directives = [];
      if (slide.style) {
        if (slide.style.class && slide.style.class !== 'default') {
          directives.push(`_class: ${slide.style.class}`);
        }
        if (slide.style.backgroundColor) {
          directives.push(`backgroundColor: "${slide.style.backgroundColor}"`);
        }
        if (slide.style.color) {
          directives.push(`color: "${slide.style.color}"`);
        }
        if (slide.style.backgroundImage) {
          directives.push(`backgroundImage: url("${slide.style.backgroundImage}")`);
        }
      }
      
      if (slide.header) directives.push(`header: "${normalize(slide.header)}"`);
      if (slide.footer) directives.push(`footer: "${normalize(slide.footer)}"`);

      if (directives.length > 0) {
        md += directives.join('\n') + '\n\n';
      }

      md += `# ${normalize(slide.title)}\n\n`;
      md += `${normalize(slide.content)}\n`;
    });

    return md;
  }

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
    console.log('🤖 AIスライド生成（構造化出力）を開始します...', { prompt });

    try {
      const model = this.getChatModel(0.7);

      if (!model) {
        console.log('⚠️ APIキーが設定されていないため、モックデータを返します');
        return this.getMockData(prompt);
      }

      console.log('📡 LangChain チェーン（構造化）を実行中...');
      
      const structuredModel = model.withStructuredOutput(PresentationSchema);

      const template = PromptTemplate.fromTemplate(`
        あなたはプロのプレゼンテーションデザイナーです。
        以下のテーマに基づいて、視覚的に美しく、構造化されたプレゼンテーションデータを作成してください。

        テーマ: {prompt}

        設計指針:
        - テーマ（theme）は内容に合わせて 'default', 'gaia', 'uncover' から最適なものを選択すること。
        - 各スライドには適切なスタイル（class, backgroundColor等）を設定し、視覚的なバリエーションを持たせること。
        - 6枚から10枚程度の構成にすること。
        - 日本語で作成すること。
      `);

      const chain = template.pipe(structuredModel);
      const result = await chain.invoke({ prompt });
      
      console.log('✅ AI生成（構造化）が完了しました。スライド数:', result.slides.length);

      return this.renderStructuredToMarkdown(result);
    } catch (error) {
      console.error('❌ AI生成エラー詳細:', error);
      if (error.stack) console.error(error.stack);
      throw new Error(`AIによるスライド生成に失敗しました: ${error.message}`);
    }
  }

  static async optimize(markdown) {
    console.log('🤖 AIスライド最適化（構造化出力）を開始します...');

    try {
      const model = this.getChatModel(0.5);

      if (!model) {
        console.log('⚠️ APIキーが設定されていないため、モックデータを返します');
        return markdown + "\n\n<!-- AIにより最適化されました（Mock） -->";
      }

      console.log('📡 LangChain チェーン（最適化・構造化）を実行中...');
      
      const structuredModel = model.withStructuredOutput(PresentationSchema);

      const template = PromptTemplate.fromTemplate(`
        以下のMarp形式のマークダウンをプロのプレゼンテーションデザイナーとして改善し、構造化されたデータとして返してください。
        内容をより簡潔にし、視覚的に訴求力のあるデザイン（Marpの機能を駆使）に修正してください。

        対象マークダウン:
        {markdown}

        改善要件:
        - 視覚的なバリエーションを増やすこと（styleの適切な設定）
        - 情報を構造化し、プレゼンテーションとしてインパクトのある構成にすること
        - 日本語で出力すること
      `);

      const chain = template.pipe(structuredModel);
      const result = await chain.invoke({ markdown });
      
      console.log('✅ AI最適化（構造化）が完了しました。スライド数:', result.slides.length);

      return this.renderStructuredToMarkdown(result);
    } catch (error) {
      console.error('❌ AI最適化エラー詳細:', error);
      if (error.stack) console.error(error.stack);
      throw new Error(`AIによるスライド最適化に失敗しました: ${error.message}`);
    }
  }

  static getMockData(prompt) {
    const data = {
      config: {
        theme: 'default',
        paginate: true,
        footer: 'Marp Editable UI'
      },
      slides: [
        {
          title: prompt,
          content: '## プレゼンテーションの概要\n- AIによって生成されたサンプルスライドです\n- APIキーを設定すると、本物のAIによる生成が可能です',
          style: { class: 'lead' }
        },
        {
          title: '主要なポイント',
          content: '1. 効率的なスライド作成\n2. インタラクティブな編集\n3. 多彩なエクスポート形式',
          style: { backgroundColor: '#f0f0f0' }
        },
        {
          title: 'まとめ',
          content: '- Marp Editable UIで快適なプレゼン作成を\n- ご清聴ありがとうございました',
          style: { class: 'invert' }
        }
      ]
    };
    
    return this.renderStructuredToMarkdown(data);
  }
}
