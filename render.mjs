// Renders video.html frame by frame into a silent 1080p MP4 (voiceover + music are added afterwards).
// Usage: node render.mjs [--stills 2,5.5,10] [--fps 30]
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const FPS = +opt("--fps", 30), DURATION = 30;
const stills = opt("--stills", null);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto("file://" + path.join(dir, "video.html") + "?render");
await page.evaluate(() => window.ready);
const stage = await page.$("#stage");
mkdirSync(path.join(dir, "out"), { recursive: true });

if (stills) {
  for (const t of stills.split(",").map(Number)) {
    await page.evaluate(t => window.setTime(t), t);
    await stage.screenshot({ path: path.join(dir, "out", `still_${t.toFixed(2)}.png`) });
  }
  await browser.close();
  process.exit(0);
}

const outFile = path.join(dir, "out", "hausman-erklaervideo.mp4");
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
  "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", outFile],
  { stdio: ["pipe", "inherit", "inherit"] });
const total = FPS * DURATION;
for (let f = 0; f < total; f++) {
  await page.evaluate(t => window.setTime(t), f / FPS);
  const buf = await stage.screenshot({ type: "jpeg", quality: 96 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
  if (f % 150 === 0) console.log(`frame ${f}/${total}`);
}
ff.stdin.end();
await new Promise(r => ff.on("close", r));
await browser.close();
console.log("done:", outFile);
