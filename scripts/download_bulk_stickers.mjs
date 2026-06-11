import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const urls = [
  { name: 'messi.png', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.png' },
  { name: 'mbappe.png', url: 'https://upload.wikimedia.org/wikipedia/commons/5/57/Kylian_Mbapp%C3%A9_2018.png' },
  { name: 'vini.png', url: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Vinicius_Jr_2021.png' },
  { name: 'haaland.png', url: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Erling_Haaland_2023_%28cropped%29.png' },
  { name: 'bellingham.png', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Jude_Bellingham_2023.png' },
  { name: 'kane.png', url: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Harry_Kane_2021.png' },
  { name: 'debruyne.png', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Kevin_De_Bruyne_20180625.png' },
  { name: 'davies.png', url: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Alphonso_Davies_2019.png' },
  { name: 'pulisic.png', url: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Christian_Pulisic_2020.png' },
  { name: 'ochoa.png', url: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Guillermo_Ochoa_2018.png' },
  { name: 'flag_arg.png', url: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Flag_of_Argentina.svg' },
  { name: 'flag_fra.png', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Flag_of_France.svg' },
  { name: 'flag_bra.png', url: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Flag_of_Brazil.svg' },
  { name: 'flag_eng.png', url: 'https://upload.wikimedia.org/wikipedia/en/b/be/Flag_of_England.svg' }
];

const destDir = path.join(__dirname, '../public/assets/stickers');
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

async function run() {
  for (const item of urls) {
    const dest = path.join(destDir, item.name);
    console.log(`Downloading ${item.name}...`);
    try {
      execSync(`curl.exe -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -o "${dest}" "${item.url}"`, { stdio: 'inherit' });
    } catch (e) {
      console.error(`Failed ${item.name}: ${e.message}`);
    }
  }
  console.log("All downloads completed.");
}

run();
