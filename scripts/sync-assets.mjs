import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const ASSET_DIRS = ["videos", "images"];

function copyDirRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return 0;
  fs.mkdirSync(destDir, { recursive: true });
  let count = 0;

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      count += copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      const srcStat = fs.statSync(srcPath);
      const shouldCopy =
        !fs.existsSync(destPath) ||
        fs.statSync(destPath).size !== srcStat.size ||
        Math.abs(fs.statSync(destPath).mtimeMs - srcStat.mtimeMs) > 1000;

      if (shouldCopy) {
        fs.copyFileSync(srcPath, destPath);
        count++;
      }
    }
  }
  return count;
}

let totalSynced = 0;
for (const dirName of ASSET_DIRS) {
  const src = path.join(ROOT, dirName);
  const dest = path.join(ROOT, "public", dirName);
  totalSynced += copyDirRecursive(src, dest);
}

console.log(`[STARSKY Asset Sync] Synced ${totalSynced} updated asset file(s) from ./videos and ./images into ./public.`);

