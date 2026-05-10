/**
 * 物料圖紙搜尋模組 (Drawing Search)
 *
 * 預建索引策略：
 * - 掃描 POR 目錄一次，建立 drawing_index.json
 * - Bot 永遠只查索引檔，不實時掃描檔案系統
 * - 凌晨 3:00 AM 自動重建，或管理員手動 #重建索引
 */

const fs = require('fs');
const path = require('path');
const { dataStore } = require('../src/core/dataStore');

// 索引檔路徑
const INDEX_FILE = path.join(__dirname, '..', 'data', 'store', 'drawing_index.json');

// 常駐記憶體快取
let _cachedIndex = null;
let _indexLoaded = false;

// 物料碼分類
const MATERIAL_CODES = {
    FST: '鐵料',
    FAC: '鋁板',
    BOM: '雜件/型材',
    BBF: '螺絲',
    FFA: '防水片/收口角',
    BGK: '墊塊',
    FHU: '加工組裝件',
    BGL: '玻璃',
    FHA: '鋁料加工件',
    FSS: '不鏽鋼',
};

// ========== 索引建立 ==========

/**
 * 遞迴掃描目錄，建立索引
 * @returns {Array} 索引陣列
 */
function scanDirectory(dirPath) {
    const results = [];
    if (!fs.existsSync(dirPath)) return results;

    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                results.push(...scanDirectory(fullPath));
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (['.pdf', '.dwg', '.dxf', '.jpg', '.png', '.tiff', '.tif'].includes(ext)) {
                    const name = entry.name;
                    // 提取系統碼（如 ACB, WWA）
                    const sysMatch = name.match(/^([A-Z]{2,4})[-_]/);
                    const system = sysMatch ? sysMatch[1] : '';
                    // 提取 POR 名稱（從路徑中）
                    const porMatch = fullPath.match(/POR[/\\]([^/\\]+)/i);
                    const por = porMatch ? porMatch[1] : '';
                    // 同目錄下是否有對應的 TG 檔案
                    let hasTag = false;
                    if (name.includes('_TG') || name.includes('-TG') || name.toUpperCase().includes('TAG')) {
                        hasTag = true; // 自己是 TG，跳過
                    } else {
                        // 找同目錄是否有含 TG 的檔案（主檔名相似）
                        try {
                            const dirEntries = fs.readdirSync(dirPath);
                            const base = path.basename(name, ext);
                            hasTag = dirEntries.some((f) =>
                                f !== name &&
                                (f.includes('_TG') || f.includes('-TG') || f.toUpperCase().includes('TAG')) &&
                                (f.includes(base) || base.includes(f.replace(/[_\-]TG.*$/i, '').replace(/\.[^.]+$/, '')))
                            );
                        } catch {}
                    }

                    results.push({
                        name,
                        path: fullPath,
                        system,
                        por,
                        hasTag,
                    });
                }
            }
        }
    } catch (e) {
        console.error(`❌ 掃描目錄失敗 (${dirPath}):`, e.message);
    }
    return results;
}

/**
 * 建立索引並寫入 JSON 檔案
 */
function buildIndex(porPath) {
    console.log(`🔍 開始建立圖紙索引: ${porPath}`);
    const start = Date.now();

    const index = scanDirectory(porPath);

    // 寫入索引檔
    const data = {
        lastBuild: new Date().toISOString(),
        porPath,
        fileCount: index.length,
        files: index,
    };
    fs.writeFileSync(INDEX_FILE, JSON.stringify(data, null, 2), 'utf8');

    // 更新記憶體快取
    _cachedIndex = index;
    _indexLoaded = true;

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`✅ 索引建立完成: ${index.length} 個檔案, 耗時 ${elapsed}s`);
    return { fileCount: index.length, elapsed };
}

/** 載入索引到記憶體 */
function loadIndex() {
    if (_indexLoaded && _cachedIndex) return _cachedIndex;
    try {
        if (fs.existsSync(INDEX_FILE)) {
            const raw = fs.readFileSync(INDEX_FILE, 'utf8');
            const data = JSON.parse(raw);
            _cachedIndex = data.files || [];
            _indexLoaded = true;
            console.log(`📂 圖紙索引已載入: ${_cachedIndex.length} 個檔案`);
            return _cachedIndex;
        }
    } catch (e) {
        console.error('❌ 載入索引失敗:', e.message);
    }
    return [];
}

// ========== 搜尋 ==========

/**
 * 搜尋圖紙（子字串匹配）
 * @returns {{ name, path, system, por, hasTag }[]}
 */
function searchDrawings(query) {
    const index = loadIndex();
    if (!index.length) return [];

    const q = query.toUpperCase();
    const results = index.filter((f) => f.name.toUpperCase().includes(q));

    return results;
}

/** 取得同目錄的 TG 檔案 */
function getTagFile(filePath) {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath, path.extname(filePath));
    try {
        const entries = fs.readdirSync(dir);
        for (const f of entries) {
            const upper = f.toUpperCase();
            const baseUpper = base.toUpperCase();
            if (f !== path.basename(filePath) &&
                (upper.includes('_TG') || upper.includes('-TG') || upper.includes('TAG')) &&
                (upper.includes(baseUpper) || baseUpper.includes(f.replace(/[_\-]TG.*$/i, '').replace(/\.[^.]+$/, '')))) {
                return path.join(dir, f);
            }
        }
    } catch {}
    return null;
}

/** 判斷是否為 TG 檔案 */
function isTagFile(filename) {
    const upper = filename.toUpperCase();
    return upper.includes('_TG') || upper.includes('-TG') || upper.includes('TAG');
}

// ========== SessionManager Handler ==========

function makeDrawingSearchHandler() {
    return {
        name: '圖紙搜尋',

        async start(ctx) {
            // 載入索引
            const index = loadIndex();
            if (!index.length) {
                return {
                    done: true,
                    result: '❌ 圖紙索引尚未建立。\n請管理員使用 `#重建索引` 建立索引。',
                };
            }
            ctx.index = index;

            // 直接帶編號（如 #圖紙 ACB-421234），跳過輸入步驟
            if (ctx._directQuery) {
                const q = ctx._directQuery;
                ctx._directQuery = null; // 清掉，避免 handleReply 再處理
                const results = searchDrawings(q);

                if (results.length === 0) {
                    return { question: `❌ 找不到包含 "*${q}*" 的圖紙。\n請重新輸入編號：` };
                }
                if (results.length > 25) {
                    ctx.step = 'filter_material';
                    ctx.allResults = results;
                    let question = `⚠️ 找到 *${results.length}* 個匹配結果。\n\n請選擇物料類型（1-11）：\n`;
                    const codes = Object.keys(MATERIAL_CODES);
                    codes.forEach((code, i) => {
                        question += `${i + 1}. ${code} (${MATERIAL_CODES[code]})\n`;
                    });
                    question += '11. 顯示全部\n輸入 *#cancel* 取消';
                    return { question };
                }
                return _showResults(ctx, results);
            }
            ctx.step = 'input';
            return {
                question:
                    '📦 *圖紙搜尋*\n\n' +
                    `📂 索引中共有 *${index.length}* 個圖紙檔案\n\n` +
                    '請輸入貨品編號的任何部分（如 1234、CB-12、421）：\n\n' +
                    '輸入 *#cancel* 取消',
            };
        },

        async handleReply(ctx, replyMessage) {
            const input = replyMessage.body.trim();

            if (input === '#cancel') {
                return { done: true, result: '❌ *圖紙搜尋已取消*' };
            }

            // 階段1：接收模糊輸入
            if (ctx.step === 'input') {
                const results = searchDrawings(input);

                if (results.length === 0) {
                    return {
                        question: `❌ 找不到包含 "*${input}*" 的圖紙。\n\n請重新輸入編號：`,
                    };
                }

                if (results.length > 25) {
                    // 太多結果 → 問物料類型
                    ctx.step = 'filter_material';
                    ctx.allResults = results;
                    let question = `⚠️ 找到 *${results.length}* 個匹配結果，太多！\n\n`;
                    question += '請選擇物料類型縮小範圍（輸入編號）：\n\n';
                    question += '*鐵料類:*\n1. FST 鐵料 | 2. FSS 不鏽鋼\n\n';
                    question += '*鋁料類:*\n3. FAC 鋁板 | 4. FHA 鋁料加工件\n\n';
                    question += '*五金類:*\n5. BBF 螺絲 | 6. FFA 防水片/收口角 | 7. BGK 墊塊\n\n';
                    question += '*其他:*\n8. BOM 雜件/型材 | 9. FHU 加工組裝件 | 10. BGL 玻璃\n\n';
                    question += '*全部顯示:* 11. 忽略篩選，顯示全部\n';
                    question += '輸入 *#cancel* 取消';
                    return { question };
                }

                // 顯示結果
                return _showResults(ctx, results);
            }

            // 階段2：物料篩選
            if (ctx.step === 'filter_material') {
                const materialKeys = Object.keys(MATERIAL_CODES);
                const num = parseInt(input, 10);

                if (num === 11) {
                    return _showResults(ctx, ctx.allResults);
                }

                if (num >= 1 && num <= 10) {
                    const code = materialKeys[num - 1];
                    const filtered = ctx.allResults.filter((f) => f.name.toUpperCase().includes(code));
                    if (filtered.length === 0) {
                        return { question: `❌ 沒有 ${code}(${MATERIAL_CODES[code]}) 類的匹配圖紙。\n請重新選擇物料類型：` };
                    }
                    return _showResults(ctx, filtered);
                }

                return { question: '❌ 請輸入 1-11 之間的數字。' };
            }

            // 階段3：選擇圖紙
            if (ctx.step === 'select') {
                const num = parseInt(input, 10);
                if (!num || num < 1 || num > ctx.shownResults.length) {
                    return { question: `❌ 請輸入 1-${ctx.shownResults.length} 之間的數字。` };
                }

                const selected = ctx.shownResults[num - 1];
                ctx.selectedFile = selected.path;
                ctx.selectedName = selected.name;
                ctx.step = 'ask_tag';

                return {
                    question:
                        `✅ 已選擇: *${selected.name}*\n` +
                        `🏢 POR: ${selected.por || '未知'}\n` +
                        (selected.system ? `🔧 系統: ${selected.system}\n` : '') +
                        `\n是否需要位置圖（Tag Drawing）？\n` +
                        `回覆 \`y\` 一併發送位置圖\n` +
                        `回覆 \`n\` 只發送加工圖`,
                };
            }

            // 階段4：是否發送 TG
            if (ctx.step === 'ask_tag') {
                const wantTag = ['y', 'yes', '是', '確認', 'ok'].includes(input.toLowerCase());
                const files = [{ path: ctx.selectedFile, name: ctx.selectedName }];

                if (wantTag) {
                    const tagFile = getTagFile(ctx.selectedFile);
                    if (tagFile) {
                        files.push({ path: tagFile, name: path.basename(tagFile) });
                    }
                }

                ctx.filesToSend = files;

                let result = '📄 *圖紙發送中...*\n\n';
                files.forEach((f, i) => {
                    result += `${i + 1}. ${f.name}\n`;
                });

                return {
                    done: true,
                    result,
                    attachments: files.map((f) => f.path),
                    attachmentCaption: files.map((f) => f.name).join(' + '),
                };
            }

            return { done: true, result: '❌ 未知步驟，搜尋已取消。' };
        },

        async onTimeout() {
            return '⏰ *圖紙搜尋已超時*，請重新發起 `#圖紙`。';
        },

        async onCancel() {
            return '❌ *圖紙搜尋已取消*';
        },
    };
}

function _showResults(ctx, results) {
    ctx.step = 'select';
    const maxShow = 10;
    const shown = results.slice(0, maxShow);
    ctx.shownResults = shown;

    let question = `🔍 找到 *${results.length}* 個匹配圖紙`;
    if (results.length > maxShow) question += `（顯示前 ${maxShow} 個）`;
    question += '：\n\n';

    shown.forEach((f, i) => {
        question += `${i + 1}. *${f.name}*\n`;
        question += `   🏢 ${f.por || '?'} | 🔧 ${f.system || '?'}\n`;
    });

    if (results.length > maxShow) {
        question += `\n… 還有 ${results.length - maxShow} 個，請輸入更具體的編號`;
    } else {
        question += '\n請輸入數字選擇圖紙';
    }
    question += '\n\n輸入 *#cancel* 取消';
    return { question };
}

// ========== 自動重建（給 scheduler 用） ==========

async function autoRebuildTask(porPath, client) {
    const result = buildIndex(porPath);
    return result;
}

// ========== 匯出 ==========

module.exports = {
    buildIndex,
    loadIndex,
    searchDrawings,
    getTagFile,
    makeDrawingSearchHandler,
    autoRebuildTask,
    get indexLoaded() { return _indexLoaded; },
    get cachedCount() { return _cachedIndex ? _cachedIndex.length : 0; },
};
