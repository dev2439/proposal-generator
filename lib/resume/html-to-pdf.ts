import { existsSync } from "fs";
import puppeteer from "puppeteer-core";

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

  if (!executablePath) {
    const chromium = (await import("@sparticuz/chromium")).default;
    executablePath = await chromium.executablePath();
    args = chromium.args;
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
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
