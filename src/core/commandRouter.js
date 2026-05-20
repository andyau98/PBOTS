/**
 * 命令路由器
 *
 * 提供統一的命令登記與分發機制。每個模組自行 register() 其命令，
 * router 負責：前綴解析、權限檢查、分發到對應處理函數。
 */
class CommandRouter {
    constructor(authManager, config) {
        this.authManager = authManager;
        this.config = config;
        this.prefix = config.bot?.prefix || '!';

        /** @type {Map<string, { handler: Function, requireAuth: boolean, isHash: boolean }>} */
        this._commands = new Map();
    }

    /**
     * 登記一個命令
     * @param {string} name - 命令名稱（不含前綴）
     * @param {Function} handler - 處理函數，簽名：async (message, context, client, services) => void
     * @param {object} [options]
     * @param {boolean} [options.requireAuth=true] - 是否需要管理員權限
     * @param {string[]} [options.aliases=[]] - 別名
     * @param {boolean} [options.isHash=false] - 是否為 # 開頭的 hash 命令
     */
    register(name, handler, options = {}) {
        const { requireAuth = true, aliases = [], isHash = false } = options;

        const entry = { handler, requireAuth, isHash };
        this._commands.set(name.toLowerCase(), entry);

        for (const alias of aliases) {
            this._commands.set(alias.toLowerCase(), entry);
        }

        console.log(`📋 已登記命令: ${isHash ? '#' : this.prefix}${name}`);
    }

    /**
     * 從訊息中解析命令名稱
     * @returns {{ command: string, isHash: boolean } | null}
     */
    parseCommand(messageBody) {
        const body = messageBody.trim();

        // Hash 命令：以 # 開頭
        if (body.startsWith('#')) {
            const cmd = body.split(' ')[0].slice(1).toLowerCase();
            if (cmd) return { command: cmd, isHash: true };
        }

        // 標準前綴命令
        if (body.startsWith(this.prefix)) {
            const cmd = body
                .slice(this.prefix.length)
                .split(' ')[0]
                .toLowerCase();
            if (cmd) return { command: cmd, isHash: false };
        }

        return null;
    }

    /**
     * 路由命令到對應處理器
     * @returns {boolean} 是否成功找到並處理了命令
     */
    async route(message, context, client, services) {
        const parsed = this.parseCommand(context.messageBody);
        if (!parsed) return false;

        const { command, isHash } = parsed;
        const entry = this._commands.get(command);

        if (!entry) {
            await message.reply(
                `❌ 未知命令: ${command}\n使用 ${this.prefix}help 查看可用命令。`
            );
            console.log(`❌ 未知命令: ${command} 來自 ${context.userId}`);
            return true;
        }

        // 權限檢查
        if (entry.requireAuth) {
            const perm = this.authManager.checkPermission(
                context.userId,
                context.groupId
            );
            if (!perm.hasFullAccess) {
                await message.reply(
                    '🚫 權限不足！您無法使用此命令。\n使用 !whitelist 獲取管理員權限。'
                );
                console.log(`🚫 權限拒絕: ${command} 來自 ${context.userId}`);
                return true;
            }
        }

        console.log(`🔄 處理命令: ${command} 來自 ${context.userId}`);
        await entry.handler(message, context, client, services);
        return true;
    }

    /**
     * 檢查是否為已登記的命令
     */
    isCommand(messageBody) {
        const parsed = this.parseCommand(messageBody);
        return parsed !== null && this._commands.has(parsed.command);
    }

    /**
     * 獲取所有已登記命令名稱（用於建置 help 文本等）
     */
    getRegisteredCommands() {
        return [...this._commands.keys()];
    }
}

module.exports = CommandRouter;
