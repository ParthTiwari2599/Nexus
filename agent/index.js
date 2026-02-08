require('dotenv').config({ path: require('path').join(__dirname, '.env.local') });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const pty = require('node-pty');
const os = require('os');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const si = require('systeminformation');
const { exec } = require('child_process');

const OWNER_ID = "user_39LnFPuopN6hocXXTnIJUSy7rqe";
const AGENT_SECRET_KEY = process.env.AGENT_SECRET_KEY || "";
const AUDIT_LOG_PATH = path.join(__dirname, "logs.txt");

const BLACKLIST_TTL_MS = 5 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 5 * 1000;
const RATE_LIMIT_MAX = 30;
const blacklist = new Map();
const rateMap = new Map();

const logAction = (action) => {
  const line = `${new Date().toISOString()} ${action}`;
  fs.appendFile(AUDIT_LOG_PATH, line + "\n", () => {});
};

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

io.on('connection', (socket) => {
  console.log('Terminal Link Established');
  let isVerified = false;
  let statsCount = 0;
  const ip = socket.handshake.address || "unknown";

  const isBlacklisted = () => {
    const until = blacklist.get(ip);
    if (!until) return false;
    if (Date.now() > until) {
      blacklist.delete(ip);
      return false;
    }
    return true;
  };

  const rateOk = () => {
    const now = Date.now();
    const entry = rateMap.get(ip);
    if (!entry || now > entry.resetAt) {
      rateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return true;
    }
    entry.count += 1;
    if (entry.count > RATE_LIMIT_MAX) return false;
    return true;
  };

  const failAndBlock = () => {
    blacklist.set(ip, Date.now() + BLACKLIST_TTL_MS);
    socket.emit('error', 'Action Failed');
    socket.disconnect();
  };

  const validateSecret = (payload) => {
    if (!AGENT_SECRET_KEY) return false;
    return payload && payload.secret === AGENT_SECRET_KEY;
  };

  const guard = (payload) => {
    if (isBlacklisted()) {
      socket.disconnect();
      return false;
    }
    if (!rateOk()) {
      failAndBlock();
      return false;
    }
    if (!validateSecret(payload)) {
      failAndBlock();
      return false;
    }
    return true;
  };

  const sendStats = async () => {
    if (!isVerified) return;
    try {
      const cpu = await si.currentLoad();
      const mem = await si.mem();
      const osInfo = await si.osInfo();

      socket.emit('sys-stats', {
        cpu: cpu.currentLoad.toFixed(1),
        memUsed: (mem.active / 1024 / 1024 / 1024).toFixed(2),
        memTotal: (mem.total / 1024 / 1024 / 1024).toFixed(2),
        platform: osInfo.platform,
        distro: osInfo.distro
      });

      statsCount += 1;
      if (statsCount % 5 === 0) {
        console.log('sys-stats emitted:', statsCount);
      }
    } catch (err) {
      console.error('Stats error');
    }
  };

  socket.on('verify-owner', (payload) => {
    if (!guard(payload)) return;
    const incomingId = payload?.userId;
    if (incomingId === OWNER_ID) {
      isVerified = true;
      console.log('OWNER VERIFIED');
      socket.emit('owner-verified');
      sendStats();
    } else {
      failAndBlock();
    }
  });

  const statsInterval = setInterval(sendStats, 2000);

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: os.homedir(),
    env: process.env
  });

  ptyProcess.onData((data) => {
    socket.emit('terminal-output', data);
  });

  socket.on('terminal-input', (payload) => {
    if (!isVerified) return;
    if (!guard(payload)) return;
    ptyProcess.write(payload?.data || "");
  });

  socket.on('get-system-info', (payload) => {
    if (!isVerified) return;
    if (!guard(payload)) return;
    socket.emit('system-info', {
      username: os.userInfo().username,
      platform: os.platform(),
      homeDir: os.homedir()
    });
  });

  socket.on('get-files', (payload) => {
    if (!isVerified) return;
    if (!guard(payload)) return;
    const targetPath = payload?.path;
    let p = targetPath || os.homedir();
    if (p.endsWith(':')) p += '\\';

    fs.readdir(p, { withFileTypes: true }, (err, files) => {
      if (err) {
        socket.emit('error', 'Action Failed');
        return;
      }
      const data = files.map(f => ({
        name: f.name,
        isDir: f.isDirectory(),
        path: path.join(p, f.name)
      }));
      socket.emit('file-list', data);
    });
  });

  socket.on('read-file', (payload) => {
    if (!isVerified) return;
    if (!guard(payload)) return;
    const normalizedPath = path.normalize(payload?.filePath || "");

    if (!fs.existsSync(normalizedPath)) {
      socket.emit('error', 'Action Failed');
      socket.emit('read-error', 'Action Failed');
      return;
    }

    fs.readFile(normalizedPath, 'utf-8', (err, content) => {
      if (err) {
        socket.emit('error', 'Action Failed');
        socket.emit('read-error', 'Action Failed');
        return;
      }
      socket.emit('file-content', { content, path: normalizedPath });
    });
  });

  socket.on('save-file', (payload) => {
    if (!isVerified) return;
    if (!guard(payload)) return;
    const normalizedPath = path.normalize(payload?.filePath || "");
    fs.writeFile(normalizedPath, payload?.content || "", 'utf-8', (err) => {
      if (err) {
        socket.emit('error', 'Action Failed');
        return;
      }
      logAction("SAVE_FILE");
      socket.emit('save-success', 'File saved!');
    });
  });

  socket.on('create-node', (payload) => {
    if (!isVerified) return;
    if (!guard(payload)) return;
    const normalizedPath = path.normalize(payload?.path || "");
    try {
      if (payload?.type === 'file') {
        fs.writeFileSync(normalizedPath, '');
      } else {
        fs.mkdirSync(normalizedPath);
      }
      logAction(payload?.type === "file" ? "CREATE_FILE" : "CREATE_FOLDER");
      socket.emit('node-created', 'Success');
    } catch (err) {
      socket.emit('error', 'Action Failed');
    }
  });

  socket.on('delete-node', (payload) => {
    if (!isVerified) return;
    if (!guard(payload)) return;
    const normalizedPath = path.normalize(payload?.path || "");
    try {
      fs.rmSync(normalizedPath, { recursive: true, force: true });
      logAction("DELETE_NODE");
      socket.emit('node-deleted', 'Success');
    } catch (err) {
      socket.emit('error', 'Action Failed');
    }
  });

  socket.on('get-processes', async (payload) => {
    if (!isVerified) return;
    if (!guard(payload)) return;
    try {
      const data = await si.processes();
      const list = data.list
        .sort((a, b) => (b.cpu || 0) - (a.cpu || 0))
        .slice(0, 15)
        .map(p => ({ pid: p.pid, name: p.name, cpu: p.cpu, mem: p.mem }));
      socket.emit('process-list', list);
    } catch (err) {
      socket.emit('error', 'Action Failed');
    }
  });

  socket.on('kill-process', (payload) => {
    if (!isVerified) return;
    if (!guard(payload)) return;
    try {
      process.kill(payload?.pid);
      logAction("KILL_PROCESS");
      socket.emit('process-killed', { success: true, pid: payload?.pid });
    } catch (e) {
      socket.emit('process-killed', { success: false, error: 'Action Failed', pid: payload?.pid });
    }
  });

  socket.on('power-command', (payload) => {
    if (!isVerified) return;
    if (!guard(payload)) return;
    let cmd = '';
    if (payload?.action === 'shutdown') cmd = 'shutdown /s /t 0';
    if (payload?.action === 'restart') cmd = 'shutdown /r /t 0';
    if (payload?.action === 'sleep') cmd = 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0';
    if (!cmd) return;
    logAction(`POWER_${(payload?.action || "").toUpperCase()}`);
    exec(cmd, (err) => {
      if (err) {
        socket.emit('error', 'Action Failed');
      }
    });
  });

  socket.on('get-audit-log', (payload) => {
    if (!isVerified) return;
    if (!guard(payload)) return;
    fs.readFile(AUDIT_LOG_PATH, "utf-8", (err, data) => {
      if (err) {
        socket.emit("audit-log", []);
        return;
      }
      const lines = data.split(/\r?\n/).filter(Boolean);
      socket.emit("audit-log", lines.slice(-5));
    });
  });

  socket.on('disconnect', () => {
    clearInterval(statsInterval);
    ptyProcess.kill();
    console.log('Terminal Session Ended');
  });
});

server.listen(4000, () => console.log("Agent Active on Port 4000"));
