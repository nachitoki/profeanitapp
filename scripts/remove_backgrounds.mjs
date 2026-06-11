import { removeBackground } from '@imgly/background-removal-node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, '../raw_stickers');
const outputDir = path.join(__dirname, '../public/assets/stickers');

if (!fs.existsSync(inputDir)) fs.mkdirSync(inputDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

async function run() {
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.png'));
  
  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file);
    console.log(`Processing ${file}...`);
    
    try {
      // Convert to valid file URL for Windows
      const fileUrl = 'file:///' + inputPath.replace(/\\/g, '/');
      const blob = await removeBackground(fileUrl);
      const buffer = Buffer.from(await blob.arrayBuffer());
      fs.writeFileSync(outputPath, buffer);
      console.log(`Saved ${file}`);
    } catch (e) {
      console.error(`Failed to process ${file}:`, e);
    }
  }
}

run();
