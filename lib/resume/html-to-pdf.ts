import { existsSync } from "fs";
import { join } from "path";
import puppeteer from "puppeteer-core";

const CHROMIUM_PACK =
  process.arch === "arm64"
    ? "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.arm64.tar"
    : "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar";

function localChromePath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const candidates = [
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];
  return candidates.find((path) => existsSync(path));
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  const localChrome = localChromePath();
  let executablePath = localChrome;
  let args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--font-render-hinting=medium",
    "--disable-dev-shm-usage",
  ];
  let headless: boolean | "shell" = true;

  if (!executablePath) {
    const chromium = (await import("@sparticuz/chromium")).default;
    chromium.setGraphicsMode = false;
    const bundledBin = join(
      process.cwd(),
      "node_modules/@sparticuz/chromium/bin",
    );
    executablePath = existsSync(bundledBin)
      ? await chromium.executablePath(bundledBin)
      : await chromium.executablePath(CHROMIUM_PACK);
    args = chromium.args;
    headless = "shell";
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless,
    args,
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "load", timeout: 45_000 });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      preferCSSPageSize: true,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
