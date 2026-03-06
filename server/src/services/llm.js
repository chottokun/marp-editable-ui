import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
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
    math: z.boolean().optional(),
  }),
  slides: z.array(SlideSchema),
});

/** 共通のシステムプロンプト */
const SYSTEM_PROMPT = `あなたはMarpプレゼンテーションの専門家です。以下の機能を使って魅力的なスライドを作成してください。

## 使用可能な機能

### 表（Markdown Table）
スライドのcontent内で標準的なMarkdownの表を使えます:
| 項目 | 説明 |
|------|------|
| A    | 内容A |

### 図・ダイアグラム（Mermaid）
content内でMermaidのコードブロックを使えます:
\`\`\`mermaid
flowchart TD
    A[開始] --> B{判定}
    B -->|Yes| C[処理]
    B -->|No| D[終了]
\`\`\`

使えるMermaid図の種類:
- flowchart TD/LR: フローチャート
- sequenceDiagram: シーケンス図
- classDiagram: クラス図
- pie: 円グラフ
- gantt: ガントチャート

### 数式（KaTeX）
content内でKaTeXの数式を使えます:
- インライン: $E = mc^2$
- ブロック: $$\\sum_{i=1}^{n} x_i$$

### 画像レイアウト
content内でMarpの画像構文を使えます:
- 背景画像: ![bg](url)
- 右に配置: ![bg right:40%](url)
- サイズ指定: ![w:500](url)

### レイアウトディレクティブ
- class: lead (タイトル用の大きなテキスト)
- class: invert (ダークモード)
- backgroundColor, color: カスタム配色

## 注意事項
- 表やMermaid図は適切な場面で積極的に使ってください
- content内はMarkdown構文をそのまま使えます
- 各スライドは簡潔で視覚的にわかりやすくしてください`;

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
    if (data.config.math) md += "math: katex\n";

    // グローバルなスタイル設定をフロントマターに追加
    const globalStyle = data.slides[0]?.style;
    if (globalStyle) {
      if (globalStyle.backgroundColor) md += `backgroundColor: "${globalStyle.backgroundColor}"\n`;
      if (globalStyle.color) md += `color: "${globalStyle.color}"\n`;
    }

    if (data.config.header) md += `header: "${normalize(data.config.header)}"\n`;
    if (data.config.footer) md += `footer: "${normalize(data.config.footer)}"\n`;
    md += "---\n\n";

    data.slides.forEach((slide, index) => {
      if (index > 0) md += "\n---\n\n";

      const directives = [];

      // グローバル（1枚目のスタイル）と異なる場合のみ個別設定を出力
      if (slide.style && index > 0) {
        if (slide.style.class && slide.style.class !== 'default') {
          directives.push(`_class: ${slide.style.class}`);
        }
        if (slide.style.backgroundColor && slide.style.backgroundColor !== globalStyle?.backgroundColor) {
          directives.push(`_backgroundColor: "${slide.style.backgroundColor}"`);
        }
        if (slide.style.color && slide.style.color !== globalStyle?.color) {
          directives.push(`_color: "${slide.style.color}"`);
        }
      } else if (slide.style?.class && slide.style.class !== 'default') {
        directives.push(`_class: ${slide.style.class}`);
      }

      if (slide.header && normalize(slide.header) !== normalize(data.config.header)) {
        directives.push(`_header: "${normalize(slide.header)}"`);
      }
      if (slide.footer && normalize(slide.footer) !== normalize(data.config.footer)) {
        directives.push(`_footer: "${normalize(slide.footer)}"`);
      }

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
  static getChatModel(temperature = 0) {
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
      const model = this.getChatModel(0);
      if (!model) return this.getMockData(prompt);

      const structuredModel = model.withStructuredOutput(PresentationSchema);

      const result = await structuredModel.invoke([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `プレゼンのテーマ: ${prompt}。スライド枚数は ${slideCount} 枚にしてください。適切な場面では表・図・数式も活用してください。簡潔に要点をまとめてください。` }
      ]);

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
      const model = this.getChatModel(0);
      if (!model) return markdown + "\n\n<!-- AIにより最適化されました（Mock） -->";

      const structuredModel = model.withStructuredOutput(PresentationSchema);

      const countInstruction = slideCount ? `、スライド枚数は ${slideCount} 枚` : "";
      const result = await structuredModel.invoke([
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user", content: `以下のMarp Markdownを、指示に従って最適化・変形した【構造化データ】として返してください。
        指示: ${instruction || "プロの視点で全体を改善し、簡潔にまとめてください。"}${countInstruction}
        表・図（Mermaid）・数式（KaTeX）を適切に活用してください。
        対象Markdown:
        ${markdown}`
        }
      ]);

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
        footer: 'Marp Editable UI',
        math: true
      },
      slides: [
        {
          title: prompt,
          content: '## プレゼンテーションの概要\n- AIによって生成されたサンプルスライドです\n- APIキーを設定すると、本物のAIによる生成が可能です',
          style: { class: 'lead' }
        },
        {
          title: '機能比較',
          content: '| 機能 | 対応状況 |\n|------|------|\n| 表 | ✅ |\n| フローチャート | ✅ Mermaid |\n| 数式 | ✅ KaTeX |\n| 画像レイアウト | ✅ |',
          style: { backgroundColor: '#f0f0f0' }
        },
        {
          title: 'フローの例',
          content: '```mermaid\nflowchart TD\n    A[スライド作成] --> B{AI生成?}\n    B -->|Yes| C[プリセット選択]\n    B -->|No| D[手動編集]\n    C --> E[プレビュー確認]\n    D --> E\n```',
        },
        {
          title: 'まとめ',
          content: '- Marp Editable UIで快適なプレゼン作成を\n- 表・図・数式でリッチなスライドを\n- ご清聴ありがとうございました\n\n$$\\text{Productivity} = \\frac{\\text{Quality}}{\\text{Time}}$$',
          style: { class: 'invert' }
        }
      ]
    };

    return this.renderStructuredToMarkdown(data);
  }
}
