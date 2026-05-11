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
    HGRH: '鋁型材',
    ACD: '鋁板',
    UN: '單元',
    AP: '防水片',
    JMA: '鋁角',
    MSB: '鐵角',
    MSA: '鐵碼',
    MSH: '鐵Hollow',
};

// ========== 索引建立 ==========

/**
 * 遞迴掃描目錄，建立索引
 * @returns {Array} 索引陣列
 */
function scanDirectory(dirPath) {
    const results = [];
    if (!fs.existsSync(dirPath)) return results;

    // 排除的非系統碼（TG, 數字開頭, 單字母, 常見詞等）
    const EXCLUDE_SYSTEMS = new Set(['TG', 'TAG', 'RF', 'FOR', 'AND', 'THE', 'NEW', 'OLD', 'POR', 'ISO', 'ASS', 'DWG', 'PDF', 'DXF', 'JPG', 'PNG', 'TIFF', 'TIF']);

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
                    const upperName = name.toUpperCase();

                    // ── 提取所有有效碼（用 - _ 分隔的 2-4 大寫字母 token） ──
                    const allCodes = [];
                    const tokens = upperName.replace(/\.[^.]+$/, '').split(/[-_]+/);
                    for (const token of tokens) {
                        const clean = token.replace(/\d.*$/, ''); // 去掉尾部數字 (如 WCA0606 → WCA)
                        if (/^[A-Z]{2,4}$/.test(clean) && !EXCLUDE_SYSTEMS.has(clean)) {
                            if (!allCodes.includes(clean)) allCodes.push(clean);
                        }
                        // 字母-數字交界 (如 WCA0606 → WCA)
                        const codeMatch = token.match(/^([A-Z]{2,4})\d/);
                        if (codeMatch && !EXCLUDE_SYSTEMS.has(codeMatch[1]) && !allCodes.includes(codeMatch[1])) {
                            allCodes.push(codeMatch[1]);
                        }
                    }

                    // ── 找出項目碼：如果第一個是 HGRH 則跳過，取第二個為項目 ──
                    let projectIdx = 0;
                    if (allCodes.length > 1 && allCodes[0] === 'HGRH') {
                        projectIdx = 1;
                    }
                    const primarySystem = allCodes.length > projectIdx ? allCodes[projectIdx] : '';
                    const systems = primarySystem ? [primarySystem] : [];
                    // 項目之前的碼（如 HGRH）也歸入物料
                    const beforeProject = allCodes.slice(0, projectIdx).filter(c => !EXCLUDE_SYSTEMS.has(c));
                    // 項目之後的碼 = 物料
                    const afterProject = allCodes.slice(projectIdx + 1).filter(c => !EXCLUDE_SYSTEMS.has(c));
                    const materials = [...beforeProject, ...afterProject];

                    // first system is the primary (first token that looks like a system code)
                    const system = systems.length > 0 ? systems[0] : '';

                    // ── POR 子目錄（跳過主目錄 01 POR ISAAC，取下一層） ──
                    const porMatch = fullPath.match(/POR[/\\][^/\\]+[/\\]([^/\\]+)/i);
                    const por = porMatch ? porMatch[1] : '';

                    // ── TG 檢測 ──
                    let hasTag = false;
                    if (name.includes('_TG') || name.includes('-TG') || upperName.includes('TAG')) {
                        hasTag = true;
                    } else {
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
                        systems,
                        por,
                        materials,
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

/** 支援 * 通配符搜尋 */
function searchDrawings(query) {
    const index = loadIndex();
    if (!index.length) return [];

    const q = query.trim().toUpperCase();
    // 如果包含 *，轉為 regex；否則為 substring 匹配
    let regex;
    if (q.includes('*')) {
        const pattern = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*');
        regex = new RegExp(pattern, 'i');
    }
    return index.filter((f) => {
        const name = f.name.toUpperCase();
        if (regex) return regex.test(name);
        return name.includes(q);
    });
}

/** 從結果中提取出現的物料碼及其數量（使用索引中預提取的 materials 欄位） */
function extractMaterialCodes(results) {
    const codes = {};
    for (const f of results) {
        if (f.materials && f.materials.length) {
            for (const code of f.materials) {
                codes[code] = (codes[code] || 0) + 1;
            }
        }
    }
    const sorted = Object.entries(codes).sort((a, b) => b[1] - a[1]);
    return sorted;
}

/** 從結果中提取出現的系統碼及其數量（使用索引中預提取的 systems 欄位） */
function extractSystemCodes(results) {
    const codes = {};
    for (const f of results) {
        const src = (f.systems && f.systems.length) ? f.systems : (f.system ? [f.system] : []);
        for (const s of src) {
            codes[s] = (codes[s] || 0) + 1;
        }
    }
    const sorted = Object.entries(codes).sort((a, b) => b[1] - a[1]);
    return sorted;
}

/** 取得同目錄的 TG 檔案 */
/** 取得同目錄所有 TG 檔案 */
function getTagFiles(filePath) {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath, path.extname(filePath));
    const results = [];
    try {
        const entries = fs.readdirSync(dir);
        for (const f of entries) {
            const upper = f.toUpperCase();
            const baseUpper = base.toUpperCase();
            if (f !== path.basename(filePath) &&
                (upper.includes('_TG') || upper.includes('-TG') || upper.includes('TAG')) &&
                (upper.includes(baseUpper) || baseUpper.includes(f.replace(/[_\-]TG.*$/i, '').replace(/\.[^.]+$/, '')))) {
                results.push(path.join(dir, f));
            }
        }
    } catch {}
    return results;
}

function getTagFile(filePath) {
    const files = getTagFiles(filePath);
    return files.length > 0 ? files[0] : null;
}

/** 找同名但不同副檔名的檔案（如 PDF → DWG） */
function findMatchingFile(filePath, targetExt) {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath, path.extname(filePath));
    const target = path.join(dir, base + targetExt);
    if (fs.existsSync(target)) return target;
    // 大小寫不敏感嘗試
    try {
        const entries = fs.readdirSync(dir);
        const want = (base + targetExt).toUpperCase();
        for (const f of entries) {
            if (f.toUpperCase() === want) return path.join(dir, f);
        }
    } catch {}
    return null;
}

// ========== SessionManager Handler ==========

const MAX_RESULTS = 20;

function makeDrawingSearchHandler() {
    return {
        name: 'Drawing 圖紙搜尋',

        async start(ctx) {
            const index = loadIndex();
            if (!index.length) {
                return {
                    done: true,
                    result: '❌ 圖紙索引尚未建立。\n請管理員使用 `#重建索引` 建立索引。',
                };
            }
            ctx.index = index;
            ctx.step = 'input';
            return {
                question:
                    '📦 *Drawing 圖紙搜尋*\n\n' +
                    `📂 索引中共有 *${index.length}* 個檔案\n\n` +
                    '請輸入圖紙編號（支援 `*` 通配符）：\n' +
                    '例如：`*FAC*123*`、`WCA-ACD-*`、`ACB`\n\n' +
                    '輸入 `#cancel` 取消',
            };
        },

        async handleReply(ctx, replyMessage) {
            const rawInput = replyMessage.body.trim();
            const input = rawInput.toUpperCase();

            if (input === '#CANCEL') {
                return { done: true, result: '❌ *Drawing 搜尋已取消*' };
            }

            // ── #R 返回上一層 ──
            if (input === '#R') {
                return _goBack(ctx);
            }

            // ── 階段1：模糊輸入 ──
            if (ctx.step === 'input') {
                if (!rawInput) {
                    return { question: '❌ 請輸入圖紙編號（支援 * 通配符）。\n輸入 `#cancel` 取消。' };
                }
                const results = searchDrawings(rawInput);

                if (results.length === 0) {
                    return { question: `❌ 找不到包含 "*${rawInput}*" 的圖紙。\n\n請重新輸入編號（#R 返回 / #cancel 取消）：` };
                }

                ctx.allResults = results;
                ctx.backStep = null;

                if (results.length > MAX_RESULTS) {
                    ctx.backStep = 'input';
                    return _askMaterialFilter(ctx, results);
                }
                ctx.backStep = 'input';
                return _showPdfSelection(ctx, results);
            }

            // ── 階段2：物料碼篩選 ──
            if (ctx.step === 'filter_material') {
                if (input === '0') {
                    ctx.backStep = 'filter_material';
                    return _showSystemOrPdf(ctx, ctx.allResults);
                }

                const idx = parseInt(input, 10) - 1;
                if (isNaN(idx) || idx < 0 || idx >= ctx.materialCodes.length) {
                    return { question: `❌ 請輸入 1-${ctx.materialCodes.length} 的數字，\`0\` 跳過篩選，\`#R\` 返回。` };
                }

                const [code] = ctx.materialCodes[idx];
                const filtered = ctx.allResults.filter((f) => f.materials && f.materials.includes(code));
                ctx.filteredResults = filtered;
                ctx.backStep = 'filter_material';
                return _showSystemOrPdf(ctx, filtered);
            }

            // ── 階段3：系統碼（項目）篩選 ──
            if (ctx.step === 'filter_system') {
                if (input === '0') {
                    ctx.backStep = 'filter_system';
                    return _showPdfSelection(ctx, ctx.filteredResults);
                }

                const idx = parseInt(input, 10) - 1;
                if (isNaN(idx) || idx < 0 || idx >= ctx.systemCodes.length) {
                    return { question: `❌ 請輸入 1-${ctx.systemCodes.length} 的數字，\`0\` 跳過篩選，\`#R\` 返回。` };
                }

                const [sysCode] = ctx.systemCodes[idx];
                const filtered = ctx.filteredResults.filter((f) =>
                    (f.systems && f.systems.includes(sysCode)) || f.system === sysCode
                );
                ctx.backStep = 'filter_system';
                return _showPdfSelection(ctx, filtered);
            }

            // ── 階段4：選擇 PDF 圖紙 ──
            if (ctx.step === 'select') {
                const pageMatch = input.match(/^P(\d+)$/);
                if (pageMatch) {
                    const targetPage = parseInt(pageMatch[1], 10);
                    const totalPages = Math.ceil(ctx.allPdfs.length / 10);
                    if (targetPage < 1 || targetPage > totalPages) {
                        return { question: `❌ 頁碼超出範圍（1-${totalPages}）。\n請輸入 \`p1\`-\`p${totalPages}\`，或 \`#R\` 返回。` };
                    }
                    return _showPdfSelection(ctx, ctx.allPdfs, targetPage);
                }

                const num = parseInt(input, 10);
                if (isNaN(num) || num < 1 || num > ctx.allPdfs.length) {
                    const extra = ctx.allPdfs.length > 10 ? `，\`p1\`-\`p${Math.ceil(ctx.allPdfs.length / 10)}\` 翻頁` : '';
                    return { question: `❌ 請輸入 1-${ctx.allPdfs.length} 的數字${extra}，或 \`#R\` 返回。` };
                }

                const pageSize = 10;
                const globalIndex = num - 1;
                const currentPage = ctx.currentPage || 1;
                const pageStart = (currentPage - 1) * pageSize;
                const localIndex = globalIndex - pageStart;
                if (localIndex < 0 || localIndex >= ctx.shownResults.length) {
                    const targetPage = Math.floor(globalIndex / pageSize) + 1;
                    return _showPdfSelection(ctx, ctx.allPdfs, targetPage);
                }
                const selected = ctx.shownResults[localIndex];
                ctx.selectedFile = selected.path;
                ctx.selectedName = selected.name;
                ctx.selectedPor = selected.por || '';
                ctx.selectedSystem = selected.system || '';
                ctx.selectedBase = path.basename(selected.name, path.extname(selected.name));

                ctx.hasDwg = !!findMatchingFile(selected.path, '.dwg') || !!findMatchingFile(selected.path, '.DWG');
                ctx.hasDxf = !ctx.hasDwg && (!!findMatchingFile(selected.path, '.dxf') || !!findMatchingFile(selected.path, '.DXF'));

                let question = `✅ 已選擇 PDF: *${selected.name}*\n` +
                    `🏢 POR: ${selected.por || '未知'}\n` +
                    (selected.system ? `🔧 系統: ${selected.system}\n` : '') +
                    `\n💡 輸入 \`#R\` 返回重新選擇`;

                ctx.backStep = 'select';
                if (ctx.hasDwg) {
                    ctx.step = 'ask_dwg';
                    question += `\n\n📎 發現同名 *.dwg* 加工圖\n需要一併發送 DWG 圖嗎？\n回覆 \`y\` 或 \`n\``;
                } else if (ctx.hasDxf) {
                    ctx.step = 'ask_dwg';
                    question += `\n\n📎 發現同名 *.dxf* 加工圖\n需要一併發送 DXF 圖嗎？\n回覆 \`y\` 或 \`n\``;
                } else {
                    const tagFiles = getTagFiles(ctx.selectedFile);
                    ctx.tagFiles = tagFiles;
                    ctx.wantDwg = false;
                    if (tagFiles.length > 0) {
                        ctx.step = 'ask_tag';
                        question += `\n\n沒有找到對應的 DWG/DXF 圖。\n需要位置圖（TG Drawing）嗎？\n回覆 \`y\` 或 \`n\``;
                    } else {
                        question += '\n\n沒有找到對應的 DWG/DXF 圖，也沒有相關的位置圖。';
                        return _buildSendResult(ctx, []);
                    }
                }
                return { question };
            }

            // ── 階段5：是否發送 DWG ──
            if (ctx.step === 'ask_dwg') {
                const isYes = ['Y', 'YES', '是', '確認', 'OK'].includes(input);
                const isNo = ['N', 'NO'].includes(input);
                if (!isYes && !isNo) {
                    return { question: `❌ 請輸入 \`y\`（是）或 \`n\`（否），或 \`#R\` 返回。` };
                }

                ctx.wantDwg = isYes;
                const tagFiles = getTagFiles(ctx.selectedFile);
                ctx.tagFiles = tagFiles;

                ctx.backStep = 'ask_dwg';
                if (tagFiles.length > 0) {
                    ctx.step = 'ask_tag';
                    return { question: `📎 此檔案所在 folder 內有 *${tagFiles.length}* 個 TG 位置圖\n需要選擇下載嗎？\n回覆 \`y\` 或 \`n\`，或 \`#R\` 返回` };
                }
                return _buildSendResult(ctx, []);
            }

            // ── 階段6：是否進入 TG 選擇 ──
            if (ctx.step === 'ask_tag') {
                const isYes = ['Y', 'YES', '是', '確認', 'OK'].includes(input);
                const isNo = ['N', 'NO'].includes(input);
                if (!isYes && !isNo) {
                    return { question: `❌ 請輸入 \`y\`（是）或 \`n\`（否），或 \`#R\` 返回。` };
                }

                if (isYes && ctx.tagFiles && ctx.tagFiles.length > 0) {
                    ctx.backStep = 'ask_tag';
                    return _showTgSelection(ctx);
                }

                return _buildSendResult(ctx, isYes ? ctx.tagFiles : []);
            }

            // ── 階段7：TG 檔案選擇 ──
            if (ctx.step === 'select_tg') {
                return _handleTgSelection(ctx, input);
            }

            return { done: true, result: '❌ 未知步驟，搜尋已取消。' };
        },

        async onTimeout() {
            return '⏰ *Drawing 搜尋已超時*，請重新發起 `#Drawing`。';
        },

        async onCancel() {
            return '❌ *Drawing 搜尋已取消*';
        },
    };
}

// ── Helper: 系統碼（項目）篩選介面 ──
function _askSystemFilter(ctx, results) {
    ctx.step = 'filter_system';
    const systemCodes = extractSystemCodes(results);
    ctx.systemCodes = systemCodes;

    let question = `⚠️ 找到 *${results.length}* 個匹配結果（>${MAX_RESULTS}）\n\n`;
    question += '*請選擇項目（系統碼）：*\n\n';

    systemCodes.forEach(([code, count], i) => {
        question += `${i + 1}. ${code} — ${count} 個\n`;
    });
    question += '\n輸入 `0` 跳過篩選\n輸入 `#cancel` 取消';

    return { question };
}

// ── Helper: 物料碼篩選介面 ──
function _askMaterialFilter(ctx, results) {
    ctx.step = 'filter_material';
    ctx.filteredResults = results;
    const materialCodes = extractMaterialCodes(results);
    ctx.materialCodes = materialCodes;

    let question = `⚠️ 仍有 *${results.length}* 個結果（>${MAX_RESULTS}）\n\n`;
    question += '*請選擇物料類型：*\n\n';

    materialCodes.forEach(([code, count], i) => {
        const label = MATERIAL_CODES[code];
        question += `${i + 1}. ${code}${label ? ' ' + label : ''} — ${count} 個\n`;
    });
    question += '\n輸入 `0` 顯示全部\n輸入 `#cancel` 取消';

    return { question };
}

// ── Helper: 物料篩選後 → 系統碼篩選或直接 PDF ──
function _showSystemOrPdf(ctx, results) {
    const systemCodes = extractSystemCodes(results);
    if (results.length > MAX_RESULTS && systemCodes.length >= 2) {
        return _askSystemFilter(ctx, results);
    }
    return _showPdfSelection(ctx, results);
}

// ── Helper: 顯示 PDF 選擇列表（支援分頁） ──
function _showPdfSelection(ctx, results, page) {
    ctx.step = 'select';
    // 只顯示 PDF
    const pdfs = results.filter((f) => f.name.toLowerCase().endsWith('.pdf'));
    ctx.allPdfs = pdfs;
    const pageSize = 10;
    const p = page || 1;
    const totalPages = Math.ceil(pdfs.length / pageSize);
    const start = (p - 1) * pageSize;
    const shown = pdfs.slice(start, start + pageSize);
    ctx.shownResults = shown;
    ctx.currentPage = p;

    let question = `🔍 找到 *${pdfs.length}* 個 PDF 圖紙`;
    if (results.length > pdfs.length) {
        question += `（另有 ${results.length - pdfs.length} 個 DWG/DXF 未顯示）`;
    }
    if (pdfs.length > pageSize) question += ` | 第 ${p}/${totalPages} 頁`;
    question += '：\n\n';

    shown.forEach((f, i) => {
        const num = start + i + 1;
        question += `${num}. *${f.name}*\n`;
        question += `   🏢 ${f.por || '--'} | 🔧 ${f.system || '--'}\n`;
    });

    question += '\n請輸入數字選擇圖紙，或輸入';
    if (p > 1) question += ` \`p${p-1}\` 上一頁`;
    if (p < totalPages) question += ` \`p${p+1}\` 下一頁`;
    question += '\n輸入 `#cancel` 取消';
    return { question };
}

// ── #R 返回上一層 ──
function _goBack(ctx) {
    const back = ctx.backStep;
    if (!back || back === 'input') {
        ctx.step = 'input';
        ctx.backStep = null;
        const index = loadIndex();
        return {
            question: '📦 *Drawing 圖紙搜尋*\n\n' +
                `📂 索引中共有 *${index.length}* 個檔案\n\n` +
                '請輸入圖紙編號（支援 `*` 通配符）：\n' +
                '例如：`*FAC*123*`、`WCA-ACD-*`、`ACB`\n\n' +
                '輸入 `#cancel` 取消',
        };
    }

    ctx.step = back;

    if (back === 'filter_material') {
        return _askMaterialFilter(ctx, ctx.allResults);
    }
    if (back === 'filter_system') {
        return _askSystemFilter(ctx, ctx.filteredResults);
    }
    if (back === 'select') {
        return _showPdfSelection(ctx, ctx.allPdfs, ctx.currentPage || 1);
    }
    if (back === 'ask_dwg') {
        let question = `✅ 已選擇 PDF: *${ctx.selectedName}*\n` +
            `🏢 POR: ${ctx.selectedPor || '未知'}\n` +
            (ctx.selectedSystem ? `🔧 系統: ${ctx.selectedSystem}\n` : '') +
            `\n💡 輸入 \`#R\` 返回重新選擇`;
        if (ctx.hasDwg) {
            question += `\n\n📎 發現同名 *.dwg* 加工圖\n需要一併發送 DWG 圖嗎？\n回覆 \`y\` 或 \`n\``;
        } else {
            question += `\n\n📎 發現同名 *.dxf* 加工圖\n需要一併發送 DXF 圖嗎？\n回覆 \`y\` 或 \`n\``;
        }
        return { question };
    }
    if (back === 'ask_tag') {
        if (ctx.tagFiles && ctx.tagFiles.length > 0) {
            return { question: `📎 此檔案所在 folder 內有 *${ctx.tagFiles.length}* 個 TG 位置圖\n需要選擇下載嗎？\n回覆 \`y\` 或 \`n\`，或 \`#R\` 返回` };
        }
        return { question: `沒有找到對應的 TG 位置圖。\n回覆 \`y\` 發送檔案，\`n\` 取消` };
    }

    // fallback
    ctx.step = 'input';
    return { question: '❌ 無法返回，請重新輸入圖紙編號：' };
}

// ── TG 檔案選擇介面 ──
function _showTgSelection(ctx) {
    ctx.step = 'select_tg';
    const tagFiles = ctx.tagFiles;
    const pdfs = tagFiles.filter((f) => path.extname(f).toLowerCase() === '.pdf');
    const dwgs = tagFiles.filter((f) => ['.dwg', '.dxf'].includes(path.extname(f).toLowerCase()));

    let question = `📎 *TG 位置圖選擇*\n\n`;
    let counter = 1;
    ctx.tgFileMap = [];

    if (pdfs.length > 0) {
        question += `*PDF 檔案 (${pdfs.length} 個):*\n`;
        for (const f of pdfs) {
            const name = path.basename(f);
            ctx.tgFileMap.push({ num: counter, path: f, name });
            question += `${counter}. ${name}\n`;
            counter++;
        }
        question += '\n';
    }

    if (dwgs.length > 0) {
        question += `*DWG/DXF 檔案 (${dwgs.length} 個):*\n`;
        for (const f of dwgs) {
            const name = path.basename(f);
            ctx.tgFileMap.push({ num: counter, path: f, name });
            question += `${counter}. ${name}\n`;
            counter++;
        }
        question += '\n';
    }

    question += '請選擇下載方式：\n';
    question += `- \`all\` 下載全部 TG（${tagFiles.length} 個）\n`;
    if (pdfs.length > 0) question += `- \`pdf\` 只下載全部 PDF（${pdfs.length} 個）\n`;
    if (dwgs.length > 0) question += `- \`dwg\` 只下載全部 DWG/DXF（${dwgs.length} 個）\n`;
    question += '- 輸入數字選擇（逗號分隔，如 `1,3,5`）\n';
    question += '- `#R` 返回 | `#cancel` 取消';

    return { question };
}

// ── 處理 TG 選擇 ──
function _handleTgSelection(ctx, input) {
    const tagFiles = ctx.tagFiles;

    if (input === 'ALL') {
        return _buildSendResult(ctx, tagFiles);
    }

    if (input === 'PDF') {
        const pdfs = tagFiles.filter((f) => path.extname(f).toLowerCase() === '.pdf');
        return _buildSendResult(ctx, pdfs);
    }

    if (input === 'DWG') {
        const dwgs = tagFiles.filter((f) => ['.dwg', '.dxf'].includes(path.extname(f).toLowerCase()));
        return _buildSendResult(ctx, dwgs);
    }

    // 數字選擇（逗號分隔）
    const parts = input.split(/[,，\s]+/).filter(Boolean);
    const nums = [];
    for (const p of parts) {
        const n = parseInt(p, 10);
        if (isNaN(n)) {
            return { question: `❌ 無法識別 "${p}"。\n請輸入數字、\`all\`、\`pdf\`、\`dwg\`，或 \`#R\` 返回。` };
        }
        nums.push(n);
    }

    if (nums.length === 0) {
        return { question: `❌ 請輸入數字、\`all\`、\`pdf\`、\`dwg\`，或 \`#R\` 返回。` };
    }

    const selected = [];
    const invalidNums = [];
    for (const n of nums) {
        const entry = ctx.tgFileMap.find((e) => e.num === n);
        if (entry) {
            selected.push(entry.path);
        } else {
            invalidNums.push(n);
        }
    }

    if (invalidNums.length > 0) {
        return { question: `❌ 編號 ${invalidNums.join(', ')} 無效。\n請輸入 1-${ctx.tgFileMap.length} 之間的數字，或 \`#R\` 返回。` };
    }

    if (selected.length === 0) {
        return { question: `❌ 未選擇任何檔案。\n請輸入數字、\`all\`、\`pdf\`、\`dwg\`，或 \`#R\` 返回。` };
    }

    return _buildSendResult(ctx, selected);
}

// ── 構建最終發送結果 ──
function _buildSendResult(ctx, tgPaths) {
    const files = [{ path: ctx.selectedFile, name: ctx.selectedName }];

    if (ctx.wantDwg) {
        const dwgPath = findMatchingFile(ctx.selectedFile, '.dwg') || findMatchingFile(ctx.selectedFile, '.DWG');
        if (dwgPath) files.push({ path: dwgPath, name: path.basename(dwgPath) });
    }

    const tgSet = new Set(Array.isArray(tgPaths) ? tgPaths : []);
    for (const tp of tgSet) {
        files.push({ path: tp, name: path.basename(tp) });
    }

    let result = '📄 *圖紙發送中...*\n';
    if (ctx.selectedPor) {
        result += `🏢 POR: ${ctx.selectedPor}\n`;
    }
    result += '\n';
    files.forEach((f, i) => {
        result += `${i + 1}. ${f.name}\n`;
    });

    return {
        done: true,
        result,
        attachments: files.map((f) => f.path),
        attachmentCaption: files.map((f) => f.name).join(' + '),
        completionMessage: '✅ 已完成所有發送',
    };
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
