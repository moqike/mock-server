import fs from 'fs';
import path from 'path';

export const MOCK_HOME = path.resolve(__dirname, '../mock_home')

export function cleanup() {
  const tmpPresetPath = `${MOCK_HOME}/preset/.tmp.ts`;
  if (fs.existsSync(tmpPresetPath)) {
    fs.unlinkSync(tmpPresetPath);
  }
}