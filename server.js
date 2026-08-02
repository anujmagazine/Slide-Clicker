const express = require("express");
const http = require("http");
const https = require("https");
const { WebSocketServer } = require("ws");
const QRCode = require("qrcode");
const { execSync, spawn, exec } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const selfsigned = require("selfsigned");

const PORT = 5678;

// When packaged as a standalone .exe via pkg, __dirname points to the
// snapshot filesystem inside the exe. overlay.ps1 must be extracted to
// a real temp path because PowerShell can only run real files.
const IS_PKG = typeof process.pkg !== "undefined";
const BASE_DIR = IS_PKG ? path.dirname(process.execPath) : __dirname;

function getOverlayScript() {
  if (IS_PKG) {
    const dest = path.join(os.tmpdir(), "slide-clicker-overlay.ps1");
    fs.writeFileSync(dest, fs.readFileSync(path.join(__dirname, "overlay.ps1")));
    return dest;
  }
  return path.join(__dirname, "overlay.ps1");
}

// Auto-open the presenter page in the default browser
function openBrowser(url) {
  const cmd = process.platform === "darwin" ? `open "${url}"`
            : process.platform === "win32"  ? `start "" "${url}"`
            : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

// Get local IP address for the QR code
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  // VPN/tunnel interface names to skip — they produce IPs unreachable by phone
  const skipNames = /tailscale|vpn|tun|tap|virtual|loopback|vethernet/i;

  for (const name of Object.keys(interfaces)) {
    if (skipNames.test(name)) continue;
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        candidates.push({ name, address: iface.address });
      }
    }
  }

  // Log all detected IPs so user can see what was found
  if (candidates.length > 0) {
    console.log("  Detected network interfaces:");
    candidates.forEach(c => console.log(`    ${c.name}: ${c.address}`));
    console.log("");
  }

  // Private IP ranges phones can reach:
  // 192.168.x.x — most home WiFi / phone hotspots
  const r1 = candidates.find(c => c.address.startsWith("192.168."));
  if (r1) return r1.address;

  // 172.16–31.x.x — corporate WiFi, some hotspots
  const r2 = candidates.find(c => {
    const second = parseInt(c.address.split(".")[1], 10);
    return c.address.startsWith("172.") && second >= 16 && second <= 31;
  });
  if (r2) return r2.address;

  // 10.x.x.x — other private range
  const r3 = candidates.find(c => c.address.startsWith("10."));
  if (r3) return r3.address;

  // Last resort: first non-VPN, non-loopback IP
  if (candidates.length > 0) return candidates[0].address;

  return "127.0.0.1";
}

// Send keystrokes via PowerShell (controls whatever app is in foreground)
function sendKey(direction) {
  const key = direction === "next" ? "{RIGHT}" : "{LEFT}";
  try {
    execSync(
      `powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${key}')"`,
      { windowsHide: true }
    );
  } catch (err) {
    console.error("Key send failed:", err.message);
  }
}

// Generate a self-signed TLS certificate so Chrome allows microphone access
// (browsers block mic on plain HTTP; HTTPS — even self-signed — unlocks it)
// SAN extension is required by Chrome 58+ — without it the cert is rejected
const attrs = [{ name: "commonName", value: "slide-clicker" }];
const pems = selfsigned.generate(attrs, {
  days: 365,
  keySize: 2048,
  algorithm: "sha256",
  extensions: [
    { name: "subjectAltName", altNames: [
      { type: 7, ip: "127.0.0.1" },
      { type: 2, value: "localhost" },
    ]},
  ],
});
const tlsOptions = { key: pems.private, cert: pems.cert };

const app = express();
const server = https.createServer(tlsOptions, app);
const wss = new WebSocketServer({ server });

const localIP = getLocalIP();
const remoteURL = `https://${localIP}:${PORT}/remote`;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(BASE_DIR, "public")));

// Gesture control — laptop page detects hand swipe, calls this to advance slide
app.post("/api/navigate", (req, res) => {
  const { direction } = req.body || {};
  if (direction === "next" || direction === "prev") {
    sendKey(direction);
    broadcast({ type: "navigated", direction });
    res.json({ ok: true });
  } else {
    res.status(400).json({ error: "invalid direction" });
  }
});

// API endpoint that returns the QR code as a data URL
app.get("/api/qr", async (req, res) => {
  try {
    const dataURL = await QRCode.toDataURL(remoteURL, {
      width: 320,
      margin: 2,
      color: { dark: "#ffffff", light: "#00000000" },
    });
    res.json({ url: remoteURL, qr: dataURL });
  } catch (err) {
    res.status(500).json({ error: "QR generation failed" });
  }
});

// Laser pointer overlay management
const POINTER_FILE = path.join(os.tmpdir(), "slide-clicker-pointer.json");
let overlayProcess = null;

function startOverlay() {
  if (overlayProcess) return;
  const script = getOverlayScript();
  overlayProcess = spawn("powershell", [
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, POINTER_FILE,
  ], { windowsHide: false, stdio: "ignore" });

  overlayProcess.on("exit", () => { overlayProcess = null; });
  console.log("  Laser overlay started");
}

function stopOverlay() {
  if (!overlayProcess) return;
  overlayProcess.kill();
  overlayProcess = null;
  // Hide the dot
  try { fs.writeFileSync(POINTER_FILE, '{"x":-1,"y":-1,"visible":false}'); } catch {}
  console.log("  Laser overlay stopped");
}

function updatePointer(x, y, visible) {
  try {
    fs.writeFileSync(POINTER_FILE, JSON.stringify({ x, y, visible }));
  } catch {}
}

// Clean up overlay on exit
process.on("exit", stopOverlay);
process.on("SIGINT", () => { stopOverlay(); process.exit(); });
process.on("SIGTERM", () => { stopOverlay(); process.exit(); });

// Track connected remotes
let remoteCount = 0;

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((c) => {
    if (c.readyState === 1) c.send(msg);
  });
}

wss.on("connection", (ws, req) => {
  const isRemote = req.url === "/ws/remote";
  if (isRemote) {
    remoteCount++;
    broadcast({ type: "remotes", count: remoteCount });
    console.log(`Remote connected (${remoteCount} active)`);
  }

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === "navigate") {
        sendKey(msg.direction);
        broadcast({ type: "navigated", direction: msg.direction });
      }
      if (msg.type === "pointer") {
        if (msg.action === "start") {
          startOverlay();
        } else if (msg.action === "stop") {
          stopOverlay();
        } else if (msg.action === "move") {
          updatePointer(msg.x, msg.y, true);
        } else if (msg.action === "hide") {
          updatePointer(-1, -1, false);
        }
      }
    } catch {}
  });

  ws.on("close", () => {
    if (isRemote) {
      remoteCount = Math.max(0, remoteCount - 1);
      broadcast({ type: "remotes", count: remoteCount });
      console.log(`Remote disconnected (${remoteCount} active)`);
    }
  });
});

// Serve remote page
app.get("/remote", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "remote.html"));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("  ╔══════════════════════════════════════════╗");
  console.log("  ║         SLIDE CLICKER — Ready!           ║");
  console.log("  ╠══════════════════════════════════════════╣");
  console.log(`  ║  Laptop:  https://localhost:${PORT}         ║`);
  console.log(`  ║  Phone:   ${remoteURL.padEnd(30)}║`);
  console.log("  ╚══════════════════════════════════════════╝");
  console.log("");
  console.log("  NOTE: Browser will warn 'connection not private' — this is normal.");
  console.log("  Click Advanced → Proceed to continue. Needed for voice/microphone.");
  console.log("");

  // Auto-open presenter page
  setTimeout(() => openBrowser(`https://localhost:${PORT}`), 1000);
});
