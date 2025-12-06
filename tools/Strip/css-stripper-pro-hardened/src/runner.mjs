
// src/runner.mjs - hardened crawler
import fs from "fs-extra";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import { URL } from "url";

let CANCEL = false;
export function cancelAll(){ CANCEL = true; }
export { cancelAll as cancel };

// Safe dynamic import helpers for CJS/ESM duals
async function importCsso() {
  try {
    const mod = await import('csso');
    if (mod && (mod.minify || (mod.default && mod.default.minify))) {
      return (css) => (mod.minify ? mod.minify(css) : mod.default.minify(css));
    }
  } catch {
    // csso not available, fall through to noop
  }
  return (css) => ({ css }); // noop if csso absent
}
async function importPurgeCSS() {
  try {
    const mod = await import('purgecss');
    if (mod.PurgeCSS) return mod.PurgeCSS;
    if (mod.default && mod.default.PurgeCSS) return mod.default.PurgeCSS;
  } catch {
    // purgecss not available, fall through to null
  }
  return null; // fallback: no purge
}

export async function runStripper(opts, log = () => {}) {
  CANCEL = false;

  const {
    url: startUrl,
    maxPages = 15,
    delayMs = 250,
    sameHost = true,
    depth = 3,
    timeout = 15000,
    output = "./out",
    safelist = "",
    respectRobots = false,
    userAgent = "css-stripper/1.1 (+https://example.invalid)",
    maxContentBytes = 2_000_000, // 2 MB per resource
    maxCssFiles = 200
  } = opts || {};

  if (!startUrl) throw new Error("--url er påkrævet");

  const outDir = path.resolve(output);
  await fs.ensureDir(path.join(outDir, "html"));
  await fs.ensureDir(path.join(outDir, "css"));
  const safelistArr = (safelist || "").split(",").map(s => s.trim()).filter(Boolean);

  const logFile = path.join(outDir, `run-${Date.now()}.log`);
  const logBoth = (m) => { try { fs.appendFileSync(logFile, m); } catch {
    // Ignore file write errors
  } log(m); };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const normalizeUrl = (u, base) => { try { return new URL(u, base).toString().replace(/#.*$/, ""); } catch { return null; } };
  const sameHostCheck = (u, base) => { try { const A = new URL(u); const B = new URL(base); return A.host === B.host; } catch { return false; } };
  const safeFileName = (u) => {
    try {
      const { hostname, pathname, search } = new URL(u);
      let p = pathname;
      if (p.endsWith("/")) p += "index.html";
      if (!path.extname(p)) p += ".html";
      const q = search ? "_" + Buffer.from(search).toString("base64url").replace(/\//g, "_") : "";
      return path.join(outDir, "html", hostname, p.replace(/[^a-zA-Z0-9._\/-]/g, "_") + q);
    } catch {
      return path.join(outDir, "html", "invalid", Date.now() + ".html");
    }
  };

  const robotsCache = new Map();
  async function robotsAllowed(u) {
    if (!respectRobots) return true;
    try {
      const url = new URL(u);
      const robotsUrl = `${url.protocol}//${url.host}/robots.txt`;
      if (!robotsCache.has(url.host)) {
        const res = await axios.get(robotsUrl, { timeout, headers: { "User-Agent": userAgent } }).catch(() => ({ data: "" }));
        robotsCache.set(url.host, res.data || "");
      }
      const rules = robotsCache.get(url.host);
      const lines = String(rules).split(/\r?\n/);
      let applies = false;
      let disallows = [];
      for (const line of lines) {
        const mUA = line.match(/^\s*User-agent:\s*(.+)\s*$/i);
        if (mUA) { const agent = mUA[1].trim(); applies = agent === "*" || agent.toLowerCase() === "css-stripper"; continue; }
        if (!applies) continue;
        const mDis = line.match(/^\s*Disallow:\s*(.*)\s*$/i);
        if (mDis) disallows.push(mDis[1].trim());
      }
      const pathOnly = url.pathname;
      return !disallows.some(rule => rule && pathOnly.startsWith(rule));
    } catch { return true; }
  }

  const queue = [{ url: startUrl, depth: 0 }];
  const visited = new Set();
  const htmlFiles = [];
  const cssHrefs = new Set();
  const inlineStyleBlocks = [];

  const http = axios.create({
    timeout,
    maxRedirects: 5,
    headers: { "User-Agent": userAgent, "Accept": "text/html,application/xhtml+xml" },
    validateStatus: s => s >= 200 && s < 400,
    transitional: { forcedJSONParsing: false }
  });

  // Fetch with retry and size cap
  async function fetchWithRetry(u, accept, tries = 3) {
    let lastErr;
    for (let i=0;i<tries;i++) {
      if (CANCEL) throw new Error("Afbrudt");
      try {
        const res = await http.get(u, {
          responseType: "arraybuffer",
          headers: { Accept: accept }
        });
        const buf = Buffer.from(res.data);
        if (buf.length > maxContentBytes) throw new Error(`Over size cap ${buf.length}`);
        return { data: buf, headers: res.headers };
      } catch (e) {
        lastErr = e;
        await sleep(200 * (i+1));
      }
    }
    throw lastErr;
  }

  while (queue.length && visited.size < maxPages) {
    if (CANCEL) { logBoth("Afbrudt.\n"); return 2; }
    const { url, depth: d } = queue.shift();
    if (visited.has(url)) continue;
    if (d > depth) continue;
    if (sameHost && !sameHostCheck(url, startUrl)) continue;
    if (!(await robotsAllowed(url))) { logBoth(`Skip pga robots: ${url}\n`); continue; }

    try {
      const { data, headers } = await fetchWithRetry(url, "text/html,application/xhtml+xml");
      const ct = String(headers["content-type"]||"");
      if (!ct.includes("text/html")) { visited.add(url); continue; }

      const html = data.toString();
      const $ = cheerio.load(html);
      $('link[rel="stylesheet"]').each((_, el) => {
        const href = $(el).attr("href");
        const abs = normalizeUrl(href, url);
        if (abs) cssHrefs.add(abs);
      });
      $("style").each((_, el) => {
        const css = $(el).html() || "";
        if (css.trim()) inlineStyleBlocks.push(css);
      });

      const filePath = safeFileName(url);
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, $.html(), "utf8");
      htmlFiles.push(filePath);

      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        const abs = normalizeUrl(href, url);
        if (!abs) return;
        if (visited.has(abs)) return;
        if (sameHost && !sameHostCheck(abs, startUrl)) return;
        queue.push({ url: abs, depth: d + 1 });
      });

      visited.add(url);
      logBoth(`OK: ${url}\n`);
      await sleep(delayMs);
    } catch (e) {
      logBoth(`Fejl: ${url} => ${e.message}\n`);
    }
  }

  let cssCount = 0;
  const cssContents = [];
  for (const href of cssHrefs) {
    if (CANCEL) { logBoth("Afbrudt.\n"); return 2; }
    if (cssCount >= maxCssFiles) { logBoth(`Stoppet efter ${maxCssFiles} CSS-filer.\n`); break; }
    try {
      const { data, headers } = await fetchWithRetry(href, "text/css,*/*");
      const ct = String(headers["content-type"]||"");
      if (!ct.includes("text/css")) { continue; }
      const text = data.toString();
      cssContents.push(`/* Source: ${href} */\n` + text);
      cssCount++;
      logBoth(`Hentet CSS: ${href}\n`);
      await sleep(30);
    } catch (e) {
      logBoth(`CSS fejl: ${href} => ${e.message}\n`);
    }
  }

  const combinedCss = (inlineStyleBlocks.length ? "/* Inline <style> blocks */\n" + inlineStyleBlocks.join("\n") + "\n" : "") +
                      cssContents.join("\n");
  await fs.writeFile(path.join(outDir, "css", "raw.css"), combinedCss, "utf8");

  // Purge step with safe dynamic import
  let strippedCss = combinedCss;
  try {
    const PurgeCSS = await importPurgeCSS();
    if (PurgeCSS) {
      const purge = new PurgeCSS();
      const res = await purge.purge({
        content: htmlFiles,
        css: [{ raw: combinedCss }],
        safelist: safelistArr
      });
      strippedCss = res && res[0] ? res[0].css : combinedCss;
    } else {
      logBoth("PurgeCSS ikke tilgængelig. Springes over.\n");
    }
  } catch (e) {
    logBoth(`PurgeCSS fejl: ${e.message}\n`);
  }

  await fs.writeFile(path.join(outDir, "css", "stripped.css"), strippedCss, "utf8");

  // Minify via dynamic csso import; noop if unavailable
  try {
    const minify = await importCsso();
    const min = minify(strippedCss).css || strippedCss;
    await fs.writeFile(path.join(outDir, "css", "stripped.min.css"), min, "utf8");
  } catch (e) {
    logBoth(`Minify fejl: ${e.message}\n`);
  }

  logBoth(`Done. HTML: ${htmlFiles.length} | CSS files: ${cssCount}\n`);
  logBoth(`Output: ${path.join(outDir, "css", "stripped.css")}\n`);
  return 0;
}
