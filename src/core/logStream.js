/**
 * 即時日誌串流
 *
 * 攔截 console.log / warn / error，緩存最近 200 條日誌，
 * 並透過 SSE (Server-Sent Events) 推送到網頁儀表板。
 */

const { EventEmitter } = require('events');

class LogStream extends EventEmitter {
    constructor(maxLines = 200) {
        super();
        this._buffer = [];
        this._maxLines = maxLines;
        this._originalLog = console.log;
        this._originalWarn = console.warn;
        this._originalError = console.error;
        this._started = false;
    }

    /** 啟動攔截 */
    start() {
        if (this._started) return;
        this._started = true;

        const self = this;
        const ts = () =>
            new Date().toLocaleTimeString('zh-HK', { hour12: false });

        console.log = (...args) => {
            const line = { time: ts(), level: 'info', text: args.join(' ') };
            self._push(line);
            self._originalLog.apply(console, args);
        };

        console.warn = (...args) => {
            const line = { time: ts(), level: 'warn', text: args.join(' ') };
            self._push(line);
            self._originalWarn.apply(console, args);
        };

        console.error = (...args) => {
            const line = { time: ts(), level: 'error', text: args.join(' ') };
            self._push(line);
            self._originalError.apply(console, args);
        };
    }

    /** 恢復原始 console */
    stop() {
        if (!this._started) return;
        console.log = this._originalLog;
        console.warn = this._originalWarn;
        console.error = this._originalError;
        this._started = false;
    }

    _push(line) {
        this._buffer.push(line);
        if (this._buffer.length > this._maxLines) {
            this._buffer = this._buffer.slice(-this._maxLines);
        }
        // 發送給所有 SSE 客戶端
        this.emit('line', line);
    }

    /** 獲取所有緩存日誌 */
    getRecent() {
        return [...this._buffer];
    }
}

// 單例
const logStream = new LogStream(200);

module.exports = { LogStream, logStream };
