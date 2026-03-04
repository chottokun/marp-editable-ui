import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

/**
 * スライド1枚の構造定義
 */
const SlideSchema = z.object({
  title: z.string(),
  content: z.string(),
  style: z.object({
    class: z.enum(["lead", "invert", "default"]).optional(),
    backgroundColor: z.string().optional(),
    color: z.string().optional(),
    backgroundImage: z.string().optional(),
  }).optional(),
  header: z.string().optional(),
  footer: z.string().optional(),
});

/**
 * プレゼンテーション全体の構造定義
 */
const PresentationSchema = z.object({
  config: z.object({
    theme: z.enum(["default", "gaia", "uncover"]),
    paginate: z.boolean(),
    header: z.string().optional(),
    footer: z.string().optional(),
  }),
  slides: z.array(SlideSchema),
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
  static getChatModel(temperature = 0) { // デフォルトを 0 に変更
    const provider = process.env.LLM_PROVIDER || 'google';
    
    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      console.log('🤖 OpenAI を使用します');
      const modelName = process.env.OPENAI_MODEL || "gpt-4o";
      return new ChatOpenAI({
        model: modelName,
        apiKey: process.env.OPENAI_API_KEY,
        temperature,
      });
    }

    if (process.env.GEMINI_API_KEY) {
      console.log('🤖 Google Gemini を使用します');
      const apiKey = process.env.GEMINI_API_KEY.trim();
      let modelName = String(process.env.GEMINI_MODEL || "gemini-2.0-flash");
      
      // モデル名の正規化（プレフィックス models/ がなければ付与する）
      if (!modelName.startsWith("models/")) {
        modelName = `models/${modelName}`;
      }
      
      console.warn(`📡 使用モデル: ${modelName}`);
      
      return new ChatGoogleGenerativeAI({
        model: modelName,
        apiKey: apiKey,
        temperature,
      });
    }

    return null;
  }

  static async generate(prompt, slideCount = 5) {
    console.log('🤖 AIスライド生成（構造化）を開始します...', { prompt, slideCount });

    try {
      const model = this.getChatModel(0); // temperature=0
      if (!model) return this.getMockData(prompt);

      // 最新の Structured Output 設定
      const structuredModel = model.withStructuredOutput(PresentationSchema);
      
      // プロンプトに枚数を明示
      const result = await structuredModel.invoke(`プレゼンのテーマ: ${prompt}。スライド枚数は ${slideCount} 枚にしてください。簡潔に要点をまとめてください。`);
      
      console.log('✅ AI生成（構造化）が完了しました。');
      return this.renderStructuredToMarkdown(result);
    } catch (error) {
      console.error('❌ AI生成エラー詳細:', error);
      throw new Error(`AIによるスライド生成に失敗しました: ${error.message}`);
    }
  }

  static async optimize(markdown, instruction = "", slideCount = null) {
    console.log('🤖 AIスライド最適化（構造化）を開始します...', { instruction, slideCount });

    try {
      const model = this.getChatModel(0); // temperature=0
      if (!model) return markdown + "\n\n<!-- AIにより最適化されました（Mock） -->";

      // 最新の Structured Output 設定
      const structuredModel = model.withStructuredOutput(PresentationSchema);

      // 既存のMarkdownを構造化データとして改善させる（枚数指定がある場合はそれを反映）
      const countInstruction = slideCount ? `最終的なスライド枚数は ${slideCount} 枚にしてください。` : "";
      const result = await structuredModel.invoke(`
        以下のMarpスライドを改善してください。
        指示: ${instruction || "プロの視点で全体を改善し、簡潔にまとめてください。"}
        ${countInstruction}
        対象Markdown:
        ${markdown}
      `);
      
      console.log('✅ AI最適化（構造化）が完了しました。');
      return this.renderStructuredToMarkdown(result);
    } catch (error) {
      console.error('❌ AI最適化エラー詳細:', error);
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
