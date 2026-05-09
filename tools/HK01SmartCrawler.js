/**
 * HK01 智能爬蟲模組
 * 使用多種策略提取地盤工傷新聞
 * 
 * @author PBOTS Team
 * @version 2.1.0
 */

const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

class HK01SmartCrawler {
    constructor(config = {}) {
        // 配置參數
        this.config = {
            // 多個數據源
            dataSources: [
                'https://www.hk01.com/search?q=地盤+工傷',
                'https://www.hk01.com/search?q=工業+意外',
                'https://www.hk01.com/search?q=地盤+安全',
                'https://www.hk01.com/tag/15206' // 地盤工傷標籤
            ],
            checkInterval: '*/10 * * * *',
            maxArticles: config.maxArticles || 20,
            enableScheduler: config.enableScheduler !== false,
            dataPath: config.dataPath || './data/seenArticles.json',
            ...config
        };

        this.seenArticles = new Set();
        this.loadSeenArticles();
        
        if (this.config.enableScheduler) {
            this.startScheduler();
        }

        console.log('🚀 HK01 智能爬蟲模組已初始化');
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
     * 獲取頁面內容
     */
    async fetchPage(url) {
        try {
            const response = await axios({
                method: 'GET',
                url,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'zh-HK,zh;q=0.9,en;q=0.8'
                },
                timeout: 15000
            });

            return response.data;
        } catch (error) {
            throw new Error(`抓取失敗: ${error.message}`);
        }
    }

    /**
     * 策略1: 從HTML中直接提取文章連結
     */
    extractArticlesFromHTML(html, sourceUrl) {
        const articles = [];
        const $ = cheerio.load(html);
        
        // 策略1: 提取帶有文章標題的連結
        $('a').each((i, el) => {
            const $el = $(el);
            const href = $el.attr('href');
            const text = $el.text().trim();
            
            if (href && text && this.isRelevantArticle(text, href)) {
                const articleId = this.generateArticleId(href, text);
                
                articles.push({
                    articleId,
                    title: text,
                    publishUrl: this.buildFullUrl(href, sourceUrl),
                    publishTime: new Date().toISOString(),
                    source: sourceUrl,
                    method: 'html_extraction'
                });
            }
        });

        return articles;
    }

    /**
     * 策略2: 嘗試解析Next.js數據
     */
    extractArticlesFromNextJS(html, sourceUrl) {
        try {
            const $ = cheerio.load(html);
            const nextData = $('#__NEXT_DATA__');
            
            if (nextData.length === 0) return [];
            
            const jsonData = JSON.parse(nextData.html());
            
            // 嘗試多種可能的數據路徑
            const possiblePaths = [
                'props.pageProps.items',
                'props.pageProps.initialState.articles',
                'props.pageProps.articles',
                'props.pageProps.data.items',
                'query.data'
            ];

            for (const path of possiblePaths) {
                const items = this.getNestedValue(jsonData, path);
                if (Array.isArray(items) && items.length > 0) {
                    return items.map(item => this.formatArticle(item, sourceUrl, 'nextjs'));
                }
            }

            return [];
        } catch (error) {
            console.log('❌ Next.js解析失敗:', error.message);
            return [];
        }
    }

    /**
     * 策略3: 從meta標籤和結構化數據提取
     */
    extractArticlesFromStructuredData(html, sourceUrl) {
        const articles = [];
        const $ = cheerio.load(html);
        
        // 提取帶有特定class的文章元素
        const articleSelectors = [
            '[class*="article"]',
            '[class*="item"]',
            '[class*="news"]',
            '.story-item',
            '.news-item',
            '.article-item'
        ];

        articleSelectors.forEach(selector => {
            $(selector).each((i, el) => {
                const $el = $(el);
                const title = $el.find('h1, h2, h3, h4, .title, .headline').first().text().trim();
                const link = $el.find('a').first().attr('href');
                
                if (title && link && this.isRelevantArticle(title, link)) {
                    const articleId = this.generateArticleId(link, title);
                    
                    articles.push({
                        articleId,
                        title,
                        publishUrl: this.buildFullUrl(link, sourceUrl),
                        publishTime: new Date().toISOString(),
                        source: sourceUrl,
                        method: 'structured_data'
                    });
                }
            });
        });

        return articles;
    }

    /**
     * 判斷是否相關文章
     */
    isRelevantArticle(title, url) {
        const relevantKeywords = [
            '地盤', '工業', '意外', '工傷', '安全', '事故', '建築', '施工',
            '工人', '高空', '墜落', '起重機', '塔吊', '天秤', '巡查', '受傷'
        ];
        
        const titleLower = title.toLowerCase();
        const urlLower = url.toLowerCase();
        
        // 排除非文章連結
        const excludePatterns = [
            '/tag/', '/search', '/author/', '/category/',
            '.jpg', '.png', '.gif', '.css', '.js'
        ];
        
        if (excludePatterns.some(pattern => urlLower.includes(pattern))) {
            return false;
        }
        
        return relevantKeywords.some(keyword => 
            titleLower.includes(keyword) || urlLower.includes(keyword)
        );
    }

    /**
     * 生成文章ID
     */
    generateArticleId(url, title) {
        return Buffer.from(url + title).toString('base64').substring(0, 32);
    }

    /**
     * 構建完整URL
     */
    buildFullUrl(href, baseUrl) {
        if (href.startsWith('http')) return href;
        if (href.startsWith('//')) return 'https:' + href;
        if (href.startsWith('/')) return 'https://www.hk01.com' + href;
        return new URL(href, baseUrl).href;
    }

    /**
     * 格式化文章數據
     */
    formatArticle(rawArticle, sourceUrl, method) {
        return {
            articleId: this.generateArticleId(rawArticle.publishUrl || rawArticle.url || '', rawArticle.title || ''),
            title: rawArticle.title || '',
            publishUrl: this.buildFullUrl(rawArticle.publishUrl || rawArticle.url || '', sourceUrl),
            publishTime: rawArticle.publishTime || new Date().toISOString(),
            source: sourceUrl,
            method: method
        };
    }

    /**
     * 獲取嵌套值
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * 檢查新文章
     */
    async checkNews() {
        console.log('\n🔄 開始檢查新文章...');
        
        const allArticles = [];
        
        for (const sourceUrl of this.config.dataSources) {
            try {
                console.log(`📡 檢查數據源: ${sourceUrl}`);
                
                const html = await this.fetchPage(sourceUrl);
                
                // 使用多種策略提取文章
                const strategies = [
                    this.extractArticlesFromNextJS(html, sourceUrl),
                    this.extractArticlesFromStructuredData(html, sourceUrl),
                    this.extractArticlesFromHTML(html, sourceUrl)
                ];
                
                for (const strategy of strategies) {
                    const articles = strategy;
                    if (articles.length > 0) {
                        console.log(`✅ ${strategy.name || '策略'} 發現 ${articles.length} 篇文章`);
                        allArticles.push(...articles);
                        break; // 使用第一個成功的策略
                    }
                }
                
            } catch (error) {
                console.log(`❌ ${sourceUrl} 檢查失敗: ${error.message}`);
            }
        }

        // 去重和篩選
        const uniqueArticles = this.deduplicateArticles(allArticles);
        const newArticles = uniqueArticles.filter(article => 
            !this.seenArticles.has(article.articleId)
        );

        console.log(`📊 總發現: ${allArticles.length} 篇 | 去重後: ${uniqueArticles.length} 篇 | 新文章: ${newArticles.length} 篇`);

        // 處理新文章
        if (newArticles.length > 0) {
            this.processNewArticles(newArticles);
        }

        return {
            success: true,
            totalArticles: allArticles.length,
            uniqueArticles: uniqueArticles.length,
            newArticles: newArticles.length,
            articles: newArticles
        };
    }

    /**
     * 文章去重
     */
    deduplicateArticles(articles) {
        const seen = new Set();
        return articles.filter(article => {
            if (seen.has(article.articleId)) return false;
            seen.add(article.articleId);
            return true;
        });
    }

    /**
     * 處理新文章
     */
    processNewArticles(articles) {
        articles.forEach(article => {
            this.seenArticles.add(article.articleId);
            this.printArticleTable(article);
            this.sendToBot(this.formatBotMessage(article));
        });
        
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
        console.log(`│ ${'日期'.padEnd(12)} │ ${'事件'.padEnd(40)} │ ${'方法'.padEnd(20)} │`);
        console.log('├' + '─'.repeat(78) + '┤');
        console.log(`│ ${date.padEnd(12)} │ ${title.padEnd(40)} │ ${article.method.padEnd(20)} │`);
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
               `*來源*: ${article.source}`;
    }

    /**
     * 發送到機器人
     */
    sendToBot(message) {
        console.log('🤖 機器人通知:');
        console.log(message);
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
     * 手動觸發檢查
     */
    async manualCheck() {
        return await this.checkNews();
    }

    /**
     * 獲取狀態
     */
    getStatus() {
        return {
            status: 'active',
            dataSources: this.config.dataSources.length,
            seenArticles: this.seenArticles.size,
            lastCheck: new Date().toISOString(),
            scheduler: this.config.enableScheduler ? 'running' : 'disabled'
        };
    }
}

module.exports = HK01SmartCrawler;