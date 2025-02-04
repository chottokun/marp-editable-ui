import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// 一時ファイルの作成
export async function createTempFile(content, ext = '.md') {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'marp-'));
  const tmpFile = path.join(tmpDir, `slide${ext}`);
  await fs.writeFile(tmpFile, content);
  return { tmpDir, tmpFile };
}

// 一時ファイルの削除
export async function cleanupTempFiles(tmpDir) {
  if (!tmpDir) return;
  
  try {
    await fs.rm(tmpDir, { recursive: true });
  } catch (error) {
    console.error('一時ファイルの削除に失敗:', {
      error: error.message,
      tmpDir,
      timestamp: new Date().toISOString()
    });
  }
}

// ファイルの存在確認
export async function checkFileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
