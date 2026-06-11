import fs from 'fs';
import https from 'https';
import path from 'path';

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const options = {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    };
    https.get(url, options, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

const dir = 's:/Clases Particulares/tutor-app/public/assets/stickers';

async function run() {
  await download('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.png/400px-Cristiano_Ronaldo_2018.png', path.join(dir, 'cr7.png'));
  await download('https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Flag_of_Portugal.svg/200px-Flag_of_Portugal.svg.png', path.join(dir, 'portugal.png'));
  await download('https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/200px-2022_FIFA_World_Cup.svg.png', path.join(dir, 'trophy.png'));
}

run();
