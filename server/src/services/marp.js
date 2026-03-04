import { Marp } from '@marp-team/marp-core';
import { marpCli } from '@marp-team/marp-cli';
import { createMarpitInstance } from '../config/app.js';
import { createTempFile, checkFileExists } from '../utils/temp.js';
import { promises as fs } from 'fs';
import path from 'path';

const marp = createMarpitInstance();

export class MarpService {
  // マークダウンをHTMLとCSSにレンダリング
  static render(markdown) {
    if (!markdown) {
      throw new Error('マークダウンが提供されていません');
    }

    // 最小限の正規化: 改行コードを LF に統一
    const normalized = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    try {
      const { html, css } = marp.render(normalized);
      if (!html) {
        console.warn('⚠️ レンダリング結果のHTMLが空です');
      }
      return { html, css };
    } catch (error) {
      console.error('❌ Marpレンダリング中に例外が発生しました:', error);
      throw new Error(`レンダリングに失敗しました: ${error.message}`);
    }
  }

  // マークダウンを指定された形式にエクスポート
  static async export(markdown, format) {
    if (!markdown || !format) {
      throw new Error('必要なパラメータが不足しています');
    }

    let tmpDir;
    console.log('📝 エクスポート処理を開始します...', { format });
    
    try {
      // 一時ファイルの作成
      console.log('🔧 一時ファイルを作成中...');
      const { tmpDir: dir, tmpFile } = await createTempFile(markdown);
      tmpDir = dir;
      console.log('✅ 一時ファイルの作成が完了しました:', {
        directory: path.basename(dir),
        file: path.basename(tmpFile)
      });

      // Marp CLIオプションの設定
      const output = `${tmpFile.replace('.md', '')}.${format}`;
      console.log('⚙️ 出力設定:', {
        format,
        outputFile: path.basename(output)
      });
      
      // CLIの引数を構築
      const cliArgs = [
        tmpFile,
        '-o', output,
        '--allow-local-files',
        '--html',
        '--pptx',
        '--pptx-editable'
      ];

      // 形式に応じた追加設定
      if (format === 'pptx') {
        cliArgs.push('--pptx', '--pptx-editable');
      } else if (format === 'png') {
        cliArgs.push('--image', '--image-scale', '2');
      }

      // 入力ファイルの存在確認
      if (!await checkFileExists(tmpFile)) {
        throw new Error(`入力ファイルが見つかりません: ${tmpFile}`);
      }

      // Marp CLIでファイル生成
      console.log('🚀 Marp CLI処理を開始...', {
        format,
        inputFile: path.basename(tmpFile),
        outputFile: path.basename(output)
      });

      try {
        await marpCli(cliArgs);
        console.log('✅ Marp CLI処理が正常に完了しました');
      } catch (error) {
        console.error('❌ Marp CLI実行エラー:', {
          error: error.message,
          stack: error.stack,
          args: cliArgs,
          format,
          tmpDir,
          input: tmpFile,
          output,
          timestamp: new Date().toISOString()
        });
        throw new Error(`Marpのエクスポート処理に失敗しました: ${error.message}`);
      }

      // 出力ファイルの存在確認
      if (!await checkFileExists(output)) {
        throw new Error(`出力ファイルが生成されませんでした: ${output}`);
      }

      // 生成されたファイルを読み込む
      console.log('出力ファイルの読み込みを開始...');
      const result = await fs.readFile(output);
      
      // 成功ログの出力
      console.log('✨ ファイル生成成功:', {
        format,
        size: `${(result.length / 1024).toFixed(2)}KB`,
        outputPath: output,
        timestamp: new Date().toISOString()
      });

      // 正常に処理が完了したことをログ出力
      console.log(`🎉 ${format.toUpperCase()}形式での変換が完了しました`);
      
      return result;
    } catch (error) {
      throw error;
    }
  }
}
