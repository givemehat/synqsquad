import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const USER_DATA_DIR = `/tmp/chrome-store-${Date.now()}`;

const SEED_USER = {
  id: "usr-google-verified-01",
  name: "Rajnish Singh",
  email: "rajnishsingh.dev@gmail.com",
  photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
  role: "Full-Stack & ML Engineer",
  college: "Gautam Buddha University",
  skills: ["Next.js", "Python", "PyTorch", "Tailwind CSS"],
  lookingFor: "both",
  bio: "Building AI applications and edge systems. Looking for hackathon partners.",
  consentAt: "2026-10-19T18:00:00.000Z",
  createdAt: "2026-10-19T18:00:00.000Z",
};

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 0;
    this.pending = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) {
            reject(new Error(msg.error.message));
          } else {
            resolve(msg.result);
          }
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function main() {
  console.log("Spawning Chrome with temp dir:", USER_DATA_DIR);
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      "--headless=new",
      "--remote-debugging-port=9222",
      `--user-data-dir=${USER_DATA_DIR}`,
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--window-size=1080,1920",
    ],
    { stdio: "ignore" }
  );

  console.log("Waiting for Chrome CDP to be available...");
  let targets = null;
  for (let i = 0; i < 20; i++) {
    try {
      const versionRes = await fetch("http://127.0.0.1:9222/json/list");
      if (versionRes.ok) {
        targets = await versionRes.json();
        if (Array.isArray(targets) && targets.length > 0) break;
      }
    } catch {}
    await sleep(500);
  }

  if (!targets) {
    throw new Error("Chrome CDP did not become available on 127.0.0.1:9222 within 10s");
  }

  try {
    const pageTarget = targets.find((t) => t.type === "page") || targets[0];
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error("No page target found on Chrome");
    }

    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();
    console.log("Connected to CDP on page:", pageTarget.id);

    await client.send("Page.enable");
    await client.send("DOM.enable");
    await client.send("Runtime.enable");

    // Force Android portrait phone viewport (1080 x 1920)
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1080,
      height: 1920,
      deviceScaleFactor: 1,
      mobile: true,
      screenWidth: 1080,
      screenHeight: 1920,
    });

    // Injected on EVERY document load before scripts run
    await client.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `
        try {
          localStorage.setItem('synqsquad_user', JSON.stringify(${JSON.stringify(SEED_USER)}));
          localStorage.setItem('synqsquad_blocked', JSON.stringify(['toxic.spammer@gmail.com']));
        } catch(e) {}
      `,
    });

    const storeDir = path.resolve(process.cwd(), "store");
    if (!fs.existsSync(storeDir)) fs.mkdirSync(storeDir, { recursive: true });

    // 1. Screenshot 1: Feed
    console.log("Navigating to Feed...");
    await client.send("Page.navigate", { url: "http://127.0.0.1:3000/" });
    for (let i = 0; i < 20; i++) {
      await sleep(500);
      const evalRes = await client.send("Runtime.evaluate", {
        expression: "document.querySelectorAll('article').length",
        returnByValue: true,
      });
      if (evalRes?.result?.value > 0) {
        console.log(`Feed loaded with ${evalRes.result.value} cards.`);
        break;
      }
    }
    await sleep(1500);

    const shot1 = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(storeDir, "screenshot-1-feed.png"), Buffer.from(shot1.data, "base64"));
    console.log("Captured screenshot-1-feed.png");

    // 2. Screenshot 2: Requisition Detail Drawer
    console.log("Opening Drawer by dispatching click event on article...");
    await client.send("Runtime.evaluate", {
      expression: `
        (() => {
          const firstCard = document.querySelector('article');
          if (firstCard) {
            firstCard.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          }
        })()
      `,
    });
    for (let i = 0; i < 20; i++) {
      await sleep(500);
      const evalRes = await client.send("Runtime.evaluate", {
        expression: "Boolean(document.querySelector('[role=\"dialog\"]') && document.querySelector('[role=\"dialog\"]').innerText.includes('Aarav Sharma'))",
        returnByValue: true,
      });
      if (evalRes?.result?.value) {
        console.log("Drawer [role=dialog] opened successfully.");
        break;
      }
    }
    await sleep(1500);

    const shot2 = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(storeDir, "screenshot-2-drawer.png"), Buffer.from(shot2.data, "base64"));
    console.log("Captured screenshot-2-drawer.png");

    // 3. Screenshot 3: People / Talent Profiles Directory
    console.log("Navigating to People talent directory...");
    await client.send("Page.navigate", { url: "http://127.0.0.1:3000/people" });
    for (let i = 0; i < 20; i++) {
      await sleep(500);
      const evalRes = await client.send("Runtime.evaluate", {
        expression: "Boolean(document.querySelector('article'))",
        returnByValue: true,
      });
      if (evalRes?.result?.value) {
        console.log("People talent directory rendered cards.");
        break;
      }
    }
    await sleep(1500);

    const shot3 = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(storeDir, "screenshot-3-people.png"), Buffer.from(shot3.data, "base64"));
    console.log("Captured screenshot-3-people.png");

    // 4. Screenshot 4: Settings & Moderation / DPDP Compliance
    console.log("Navigating to Settings page...");
    await client.send("Page.navigate", { url: "http://127.0.0.1:3000/settings" });
    for (let i = 0; i < 20; i++) {
      await sleep(500);
      const evalRes = await client.send("Runtime.evaluate", {
        expression: "document.body.innerText.includes('rajnishsingh.dev@gmail.com')",
        returnByValue: true,
      });
      if (evalRes?.result?.value) {
        console.log("Settings rendered authenticated user profile.");
        break;
      }
    }
    await sleep(1500);

    const shot4 = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(storeDir, "screenshot-4-profile.png"), Buffer.from(shot4.data, "base64"));
    console.log("Captured screenshot-4-profile.png");

    client.close();
    console.log("All screenshots captured successfully!");
  } finally {
    try { chromeProcess.kill(); } catch {}
    try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }); } catch {}
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
