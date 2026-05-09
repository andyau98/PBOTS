/**
 * 內建監控 HTTP 伺服器
 *
 * - 登入前：顯示 QR Code 頁面供掃描
 * - 登入後：即時監控儀表板（統計數據 + 即時 terminal 日誌串流）
 * - SSE (Server-Sent Events) 推送即時日誌
 */

const http = require('http');
const { logStream } = require('./logStream');

class MonitorServer {
    constructor(port = 3456) {
        this.port = port;
        this._isReady = false;
        this._qrDataUrl = '';
        this._services = null;
        this._server = null;
        this._sseClients = new Set();
    }

    start(services) {
        this._services = services;

        this._server = http.createServer((req, res) => {
            const url = new URL(req.url, `http://localhost:${this.port}`);

            switch (url.pathname) {
            case '/':
                this._servePage(res);
                break;
            case '/api/status':
                this._serveApiStatus(res);
                break;
            case '/api/logs/stream':
                this._serveSse(req, res);
                break;
            default:
                res.writeHead(404);
                res.end('Not Found');
            }
        });

        // SSE 訂閱日誌事件
        logStream.on('line', (line) => {
            const data = JSON.stringify(line);
            for (const client of this._sseClients) {
                try { client.write(`data: ${data}\n\n`); } catch {}
            }
        });

        this._server.listen(this.port, () => {
            console.log(`🌐 監控儀表板: http://localhost:${this.port}`);
        });
    }

    setQrDataUrl(dataUrl) { this._qrDataUrl = dataUrl; }
    setReady(ready = true) { this._isReady = ready; }

    stop() {
        if (this._server) this._server.close();
    }

    // ========== SSE ==========

    _serveSse(req, res) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
        });

        // 發送歷史日誌
        const recent = logStream.getRecent();
        for (const line of recent.slice(-50)) {
            res.write(`data: ${JSON.stringify(line)}\n\n`);
        }

        this._sseClients.add(res);
        req.on('close', () => { this._sseClients.delete(res); });
    }

    // ========== Page ==========

    _servePage(res) {
        const isReady = this._isReady;
        const qrData = this._qrDataUrl;

        const html = `<!DOCTYPE html>
<html lang="zh-HK">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>PBOTS 監控儀表板</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0b1120;color:#e2e8f0;min-height:100vh}
.header{background:#131c2e;padding:12px 20px;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between;align-items:center}
.header h1{font-size:1.1rem;color:#38bdf8}
.dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px}
.dot.on{background:#22c55e;box-shadow:0 0 6px #22c55e}
.dot.off{background:#ef4444;box-shadow:0 0 6px #ef4444}
.main{display:flex;height:calc(100vh - 49px)}
.left{flex:1;overflow-y:auto;padding:16px}
.right{width:480px;background:#0f172a;border-left:1px solid #1e293b;display:flex;flex-direction:column}
.log-header{background:#131c2e;padding:8px 16px;font-size:0.8rem;color:#64748b;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between}
.log-body{flex:1;overflow-y:auto;padding:8px;font-family:'SF Mono',Monaco,Menlo,monospace;font-size:0.72rem;line-height:1.5}
.log-line{padding:2px 6px;border-bottom:1px solid #0f172a;display:flex;gap:8px}
.log-line .t{color:#475569;white-space:nowrap}
.log-line .m{word-break:break-all}
.log-line.info .m{color:#94a3b8}
.log-line.warn .m{color:#f59e0b}
.log-line.error .m{color:#ef4444}
.qr-section{text-align:center;padding:60px 20px}
.qr-section img{max-width:300px;border:3px solid #25D366;border-radius:12px;padding:12px;background:#fff}
.qr-section h2{color:#25D366;margin-bottom:16px;font-size:1.3rem}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:12px}
.card{background:#131c2e;border-radius:8px;padding:14px;border:1px solid #1e293b}
.card h3{font-size:0.7rem;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px}
.card .val{font-size:1.6rem;font-weight:700;color:#f8fafc}
.card .val.sm{font-size:1rem}
.card .sub{font-size:0.7rem;color:#475569;margin-top:3px}
.list-item{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #0f172a;font-size:0.75rem}
.list-item:last-child{border:none}
.badge{display:inline-block;padding:1px 7px;border-radius:6px;font-size:0.65rem;font-weight:600}
.badge.g{background:#064e3b;color:#22c55e}
.badge.r{background:#450a0a;color:#ef4444}
.badge.y{background:#422006;color:#f59e0b}
.hidden{display:none}
.refresh{font-size:0.65rem;color:#334155;text-align:center;margin-top:10px}
</style>
</head>
<body>
<div class="header">
  <h1>🤖 PBOTS</h1>
  <div id="status-indicator">
    <span class="dot ${isReady ? 'on' : 'off'}"></span>
    <span id="status-text" style="font-size:0.8rem">${isReady ? '已連接' : '等待掃碼登入'}</span>
  </div>
</div>
<div class="main">
  <div class="left">
    <div id="qr-section" class="qr-section ${isReady ? 'hidden' : ''}">
      <h2>📱 請用 WhatsApp 掃描 QR Code</h2>
      ${qrData ? `<img src="${qrData}" alt="QR Code">` : '<p>⏳ QR Code 生成中...</p>'}
      <p style="color:#64748b;font-size:0.8rem;margin-top:12px">掃描成功後頁面自動切換為監控儀表板</p>
    </div>

    <div id="dashboard" class="${isReady ? '' : 'hidden'}">
      <div class="grid">
        <div class="card"><h3>📨 今日訊息</h3><div class="val" id="m-total">-</div><div class="sub">群組 <span id="m-group">-</span> | 私訊 <span id="m-pvt">-</span></div></div>
        <div class="card"><h3>⚡ 命令</h3><div class="val" id="m-cmd">-</div><div class="sub">媒體 <span id="m-media">-</span></div></div>
        <div class="card"><h3>👑 管理</h3><div class="val sm" id="m-admin">-</div><div class="sub">授權群組 <span id="m-grp">-</span> | 封鎖 <span id="m-blk">-</span></div></div>
        <div class="card"><h3>⏱️ 運行</h3><div class="val sm" id="m-uptime">-</div><div class="sub">訊息 <span id="m-ttl">-</span> | 錯誤 <span id="m-err">-</span></div></div>
      </div>
      <div class="grid" style="grid-template-columns:1fr 1fr">
        <div class="card"><h3>📋 活躍會話</h3><div id="sessions" style="font-size:0.75rem">-</div></div>
        <div class="card"><h3>🔐 安全</h3><div id="sec-info" style="font-size:0.75rem">-</div></div>
      </div>
      <div class="refresh" id="refresh-time">🔄 每 5 秒刷新</div>
    </div>
  </div>
  <div class="right">
    <div class="log-header">
      <span>📟 Terminal 即時日誌</span>
      <span style="font-size:0.65rem"><span id="log-count">0</span> 條</span>
    </div>
    <div class="log-body" id="log-container"></div>
  </div>
</div>

<script>
let isReady = ${isReady};

// ===== 即時日誌 SSE =====
const logContainer = document.getElementById('log-container');
let logCount = 0;
const MAX_LOG_LINES = 300;

function addLog(line) {
  const div = document.createElement('div');
  div.className = 'log-line ' + line.level;
  div.innerHTML = '<span class="t">' + line.time + '</span><span class="m">' + line.text + '</span>';
  logContainer.appendChild(div);
  logCount++;
  document.getElementById('log-count').textContent = logCount;
  // 限制行數
  while (logContainer.children.length > MAX_LOG_LINES) logContainer.removeChild(logContainer.firstChild);
  // 自動捲到底部
  logContainer.scrollTop = logContainer.scrollHeight;
}

const sse = new EventSource('/api/logs/stream');
sse.onmessage = (e) => {
  try { const line = JSON.parse(e.data); addLog(line); } catch {}
};

// ===== 狀態輪詢 =====
async function fetchStatus() {
  try {
    const resp = await fetch('/api/status');
    const d = await resp.json();
    if (!isReady && d.ready) {
      isReady = true;
      document.getElementById('qr-section').classList.add('hidden');
      document.getElementById('dashboard').classList.remove('hidden');
      document.getElementById('status-indicator').innerHTML = '<span class="dot on"></span><span style="font-size:0.8rem">已連接</span>';
    }
    if (isReady) updateDashboard(d);
  } catch(e) {}
}

function updateDashboard(d) {
  document.getElementById('m-total').textContent = d.stats?.totalMessages ?? '-';
  document.getElementById('m-group').textContent = d.stats?.groupMessages ?? '-';
  document.getElementById('m-pvt').textContent = d.stats?.privateMessages ?? '-';
  document.getElementById('m-cmd').textContent = d.stats?.commands ?? '-';
  document.getElementById('m-media').textContent = d.stats?.mediaMessages ?? '-';
  document.getElementById('m-admin').textContent = (d.security?.adminCount??0) + ' 人';
  document.getElementById('m-grp').textContent = d.security?.authorizedGroupCount ?? 0;
  document.getElementById('m-blk').textContent = d.security?.blockedCount ?? 0;
  document.getElementById('m-uptime').textContent = d.uptime ?? '-';
  document.getElementById('m-ttl').textContent = d.health?.messageCount ?? 0;
  document.getElementById('m-err').textContent = d.health?.errorCount ?? 0;

  const sessions = d.sessions || [];
  document.getElementById('sessions').innerHTML = sessions.length > 0
    ? sessions.map(s => '<div class="list-item"><span>👤 ' + s.userId + '</span><span class="badge g">' + s.handler + '</span><span>' + s.step + '步 ' + s.elapsedSeconds + 's</span></div>').join('')
    : '<div class="list-item">暫無</div>';

  document.getElementById('sec-info').innerHTML =
    '<div class="list-item"><span>白名單</span><span class="badge ' + (d.security?.whitelistEnabled ? 'g' : 'r') + '">' + (d.security?.whitelistEnabled ? '啟用' : '禁用') + '</span></div>' +
    '<div class="list-item"><span>管理員</span><span>' + (d.security?.adminCount??0) + ' 人</span></div>' +
    '<div class="list-item"><span>授權群組</span><span>' + (d.security?.authorizedGroupCount??0) + ' 個</span></div>' +
    '<div class="list-item"><span>前綴</span><span>' + (d.commandPrefix||'!') + '</span></div>' +
    '<div class="list-item"><span>版本</span><span>' + (d.version||'1.0.0') + '</span></div>';

  document.getElementById('refresh-time').textContent = '🔄 ' + new Date().toLocaleTimeString('zh-HK',{hour12:false});
}

fetchStatus(); setInterval(fetchStatus, 5000);
</script>
</body>
</html>`;

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    // ========== API ==========

    _serveApiStatus(res) {
        if (!this._services) { res.writeHead(503); return res.end(JSON.stringify({ error: '未初始化' })); }

        const { authManager, sessionManager, messageLogger, healthMonitor, config } = this._services;
        const stats = messageLogger?.getTodayStats() || {};
        const health = healthMonitor?.getSystemStatus() || {};
        const security = authManager?.getSecurityStatus() || {};
        const sessions = sessionManager?.getSummary() || [];

        const uptimeMs = health.uptime?.totalMs || 0;
        const d = Math.floor(uptimeMs / 86400000);
        const h = Math.floor((uptimeMs % 86400000) / 3600000);
        const m = Math.floor((uptimeMs % 3600000) / 60000);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            ready: this._isReady,
            timestamp: new Date().toISOString(),
            uptime: d + 'd ' + h + 'h ' + m + 'm',
            stats: {
                totalMessages: stats.totalMessages || 0,
                groupMessages: stats.groupMessages || 0,
                privateMessages: stats.privateMessages || 0,
                commands: stats.commands || 0,
                mediaMessages: stats.mediaMessages || 0,
            },
            security: {
                whitelistEnabled: security.whitelistEnabled,
                adminCount: security.adminCount || 0,
                blockedCount: security.blockedCount || 0,
                authorizedGroupCount: security.authorizedGroupCount || 0,
            },
            health: {
                messageCount: health.messageCount || 0,
                errorCount: health.errorCount || 0,
            },
            sessions: sessions.map(s => ({ userId: s.userId, handler: s.handler, step: s.step, elapsedSeconds: s.elapsedSeconds })),
            commandPrefix: config?.bot?.prefix || '!',
            version: config?.project?.version || '1.0.0',
        }));
    }
}

module.exports = MonitorServer;
