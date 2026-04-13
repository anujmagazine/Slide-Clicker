const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const QRCode = require("qrcode");
const { execSync, spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const PORT = 3000;

// Get local IP address for the QR code
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
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

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const localIP = getLocalIP();
const remoteURL = `http://${localIP}:${PORT}/remote`;

app.use(express.static(path.join(__dirname, "public")));

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
  const script = path.join(__dirname, "overlay.ps1");
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
  console.log(`  ║  Laptop:  http://localhost:${PORT}          ║`);
  console.log(`  ║  Phone:   ${remoteURL.padEnd(30)}║`);
  console.log("  ╚══════════════════════════════════════════╝");
  console.log("");
  console.log("  Open your presentation, then scan the QR code with your phone.");
  console.log("");
});
