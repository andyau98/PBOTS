/**
 * HK01 Next.js 爬蟲模組
 * 使用HTML解析和Next.js JSON數據提取地盤工傷新聞
 * 
 * @author PBOTS Team
 * @version 2.0.0
 */

const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

class HK01NextJSCrawler {
    constructor(config = {}) {
        // 配置參數
        this.config = {
            tagUrl: 'https://www.hk01.com/tag/15206', // 地盤工傷標籤頁面
            checkInterval: '*/10 * * * *', // 每10分鐘檢查一次
            maxArticles: config.maxArticles || 20,
            enableScheduler: config.enableScheduler !== false,
            dataPath: config.dataPath || './data/seenArticles.json',
            ...config
        };

        // 已讀文章存儲
        this.seenArticles = new Set();
        
        // 初始化
        this.loadSeenArticles();
        
        // 啟動定時任務
        if (this.config.enableScheduler) {
            this.startScheduler();
        }

        console.log('🚀 HK01 Next.js 爬蟲模組已初始化');
    }

    /**
     * 加載已讀文章列表
     */
    loadSeenArticles() {
        try {
            const dataPath = path.resolve(this.config.dataPath);
            if (fs.existsSync(dataPath)) {
                const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
                this.seenArticles = new Set(data.articles || []);
                console.log(`📚 已加載 ${this.seenArticles.size} 篇已讀文章`);
            }
        } catch (error) {
            console.warn('⚠️ 加載已讀文章列表失敗:', error.message);
        }
    }

    /**
     * 保存已讀文章列表
     */
    saveSeenArticles() {
        try {
            const dataPath = path.resolve(this.config.dataPath);
            const dir = path.dirname(dataPath);
            
            // 確保目錄存在
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            const data = {
                articles: Array.from(this.seenArticles),
                lastUpdated: new Date().toISOString()
            };
            
            fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
            console.log(`💾 已保存 ${this.seenArticles.size} 篇已讀文章`);
        } catch (error) {
            console.error('❌ 保存已讀文章列表失敗:', error.message);
        }
    }

    /**
     * 獲取HTML頁面內容
     */
    async fetchPage(url) {
        try {
            console.log(`🔍 抓取頁面: ${url}`);
            
            const response = await axios({
                method: 'GET',
                url,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'zh-HK,zh;q=0.9,en;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Referer': 'https://www.hk01.com/',
                    'DNT': '1',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'same-origin'
                },
                timeout: 15000,
                validateStatus: function (status) {
                    return status >= 200 && status < 300;
                }
            });

            console.log(`✅ 成功獲取頁面內容 (${response.data.length} 字符)`);
            return response.data;

        } catch (error) {
            console.error(`❌ 抓取頁面失敗: ${error.message}`);
            throw error;
        }
    }

    /**
     * 解析Next.js JSON數據
     */
    parseNextJSData(html) {
        try {
            const $ = cheerio.load(html);
            const scriptTag = $('#__NEXT_DATA__');
            
            if (!scriptTag.length) {
                throw new Error('未找到 __NEXT_DATA__ 標籤');
            }

            const jsonData = JSON.parse(scriptTag.html());
            
            // 提取文章列表數據
            const articles = jsonData?.props?.pageProps?.items || 
                           jsonData?.props?.pageProps?.initialState?.articles ||
                           jsonData?.props?.pageProps?.articles || [];

            console.log(`📰 解析到 ${articles.length} 篇文章`);
            return articles;

        } catch (error) {
            console.error('❌ 解析Next.js數據失敗:', error.message);
            throw error;
        }
    }

    /**
     * 格式化文章數據
     */
    formatArticle(article) {
        // 處理不同數據結構
        const articleId = article.articleId || article.id || article._id || '';
        const title = article.title || article.headline || '';
        const publishUrl = article.publishUrl || article.url || article.link || '';
        const publishTime = article.publishTime || article.publishedAt || article.date || '';
        
        // 構建完整URL
        const fullUrl = publishUrl.startsWith('http') ? 
            publishUrl : `https://www.hk01.com${publishUrl}`;

        return {
            articleId,
            title: title.trim(),
            publishUrl: fullUrl,
            publishTime: this.formatDate(publishTime),
            crawlTime: new Date().toISOString(),
            source: 'HK01 Tag 15206'
        };
    }

    /**
     * 格式化日期
     */
    formatDate(dateString) {
        if (!dateString) return new Date().toISOString();
        
        try {
            return new Date(dateString).toISOString();
        } catch (error) {
            return new Date().toISOString();
        }
    }

    /**
     * 檢查新文章
     */
    async checkNews() {
        try {
            console.log('\n🔄 開始檢查新文章...');
            
            // 獲取頁面內容
            const html = await this.fetchPage(this.config.tagUrl);
            
            // 解析JSON數據
            const articles = this.parseNextJSData(html);
            
            // 格式化文章數據
            const formattedArticles = articles
                .map(article => this.formatArticle(article))
                .filter(article => article.articleId && article.title)
                .slice(0, this.config.maxArticles);

            // 篩選新文章
            const newArticles = formattedArticles.filter(article => 
                !this.seenArticles.has(article.articleId)
            );

            console.log(`📊 發現 ${newArticles.length} 篇新文章`);

            // 處理新文章
            if (newArticles.length > 0) {
                this.processNewArticles(newArticles);
            }

            return {
                success: true,
                totalArticles: formattedArticles.length,
                newArticles: newArticles.length,
                articles: newArticles
            };

        } catch (error) {
            console.error('❌ 檢查新文章失敗:', error.message);
            return {
                success: false,
                error: error.message,
                totalArticles: 0,
                newArticles: 0,
                articles: []
            };
        }
    }

    /**
     * 處理新文章
     */
    processNewArticles(articles) {
        articles.forEach(article => {
            // 標記為已讀
            this.seenArticles.add(article.articleId);
            
            // 格式化輸出
            this.printArticleTable(article);
            
            // 觸發通知
            this.sendToBot(this.formatBotMessage(article));
        });

        // 保存已讀列表
        this.saveSeenArticles();
    }

    /**
     * 格式化表格輸出
     */
    printArticleTable(article) {
        const date = new Date(article.publishTime).toLocaleDateString('zh-HK');
        const title = article.title.length > 40 ? 
            article.title.substring(0, 37) + '...' : article.title;
        
        console.log('\n📰 新文章發現:');
        console.log('┌' + '─'.repeat(78) + '┐');
        console.log(`│ ${'日期'.padEnd(12)} │ ${'事件'.padEnd(40)} │ ${'連結'.padEnd(20)} │`);
        console.log('├' + '─'.repeat(78) + '┤');
        console.log(`│ ${date.padEnd(12)} │ ${title.padEnd(40)} │ ${'點擊查看'.padEnd(20)} │`);
        console.log('└' + '─'.repeat(78) + '┘');
        console.log(`🔗 連結: ${article.publishUrl}`);
    }

    /**
     * 格式化機器人消息
     */
    formatBotMessage(article) {
        const date = new Date(article.publishTime).toLocaleDateString('zh-HK');
        return `📰 *新地盤工傷事件*\n\n` +
               `*標題*: ${article.title}\n` +
               `*日期*: ${date}\n` +
               `*連結*: ${article.publishUrl}\n` +
               `*來源*: HK01 地盤工傷標籤`;
    }

    /**
     * 發送到機器人（預留接口）
     */
    sendToBot(message) {
        // 預留接口，後續可對接到WhatsApp Bot
        console.log('🤖 機器人通知（預留接口）:');
        console.log(message);
        
        // 這裡可以添加實際的機器人集成代碼
        // 例如: whatsappBot.sendMessage(message);
    }

    /**
     * 啟動定時任務
     */
    startScheduler() {
        console.log(`⏰ 啟動定時任務: 每10分鐘檢查一次`);
        
        cron.schedule(this.config.checkInterval, async () => {
            console.log('\n⏰ 定時任務執行中...');
            await this.checkNews();
        });
    }

    /**
     * 獲取爬蟲狀態
     */
    getStatus() {
        return {
            status: 'active',
            config: this.config,
            seenArticles: this.seenArticles.size,
            lastCheck: new Date().toISOString(),
            scheduler: this.config.enableScheduler ? 'running' : 'disabled'
        };
    }

    /**
     * 手動觸發檢查
     */
    async manualCheck() {
        return await this.checkNews();
    }
}

module.exports = HK01NextJSCrawler;