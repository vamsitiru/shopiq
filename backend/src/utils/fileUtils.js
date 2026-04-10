import fs from 'fs';
import { platform } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

export default function readJSONFile(filePath) {
  try {
    console.log(`Reading JSON file from path: ${filePath}`);
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, '../../stubs/', filePath);
    const data = fs.readFileSync(absolutePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading JSON file at ${filePath}:`, error);
    throw new Error(`Failed to read JSON file: ${error.message}`);
  }
}
