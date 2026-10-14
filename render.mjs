// Renders video.html frame by frame into an MP4 (with a marker scribble sound).
// Usage: node render.mjs [--stills 2,5.5,10] [--fps 30]
import { chromium } from "playwright";
import { spawn, execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const FPS = +opt("--fps", 30), DURATION = 30;
const stills = opt("--stills", null);

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--allow-file-access-from-files"],
});
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

// --- marker sound: filtered noise while the pen is on the board ---
const intervals = await page.evaluate(() => window.drawIntervals());
const SR = 44100, N = SR * DURATION, pcm = new Int16Array(N);
let lp = 0, lp2 = 0, seed = 12345;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  let env = 0;
  for (const [a, b, isText] of intervals) {
    if (t >= a && t <= b) {
      const edge = Math.min(1, (t - a) / 0.03, (b - t) / 0.03);
      // squeaky strokes: amplitude wobbles faster when writing
      const wob = 0.65 + 0.35 * Math.sin(t * (isText ? 55 : 22) * Math.PI);
      env = Math.max(env, edge * wob);
    }
  }
  const n = rnd();
  lp += 0.35 * (n - lp);          // low-pass
  lp2 += 0.02 * (lp - lp2);       // remove rumble (high-pass = lp - lp2)
  pcm[i] = Math.max(-32767, Math.min(32767, (lp - lp2) * env * 9000));
}
const wav = Buffer.alloc(44 + N * 2);
wav.write("RIFF", 0); wav.writeUInt32LE(36 + N * 2, 4); wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(SR, 24); wav.writeUInt32LE(SR * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
wav.write("data", 36); wav.writeUInt32LE(N * 2, 40);
Buffer.from(pcm.buffer).copy(wav, 44);
const wavPath = path.join(dir, "out", "marker.wav");
writeFileSync(wavPath, wav);

// --- frames -> ffmpeg ---
const silent = path.join(dir, "out", "silent.mp4");
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
  "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", silent],
  { stdio: ["pipe", "inherit", "inherit"] });
const total = FPS * DURATION;
for (let f = 0; f < total; f++) {
  await page.evaluate(t => window.setTime(t), f / FPS);
  const buf = await stage.screenshot({ type: "jpeg", quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
  if (f % 90 === 0) console.log(`frame ${f}/${total}`);
}
ff.stdin.end();
await new Promise(r => ff.on("close", r));
await browser.close();

execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", silent, "-i", wavPath, "-c:v", "copy",
  "-c:a", "aac", "-b:a", "160k", "-shortest", path.join(dir, "out", "hausman-erklaervideo.mp4")]);
console.log("done: out/hausman-erklaervideo.mp4");
