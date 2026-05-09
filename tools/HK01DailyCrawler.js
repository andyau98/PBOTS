/**
 * HK01每日爬虫
 * 实时监控新文章，按日爬取并更新数据库
 */

const HK01HistoricalCrawler = require('./HK01HistoricalCrawler');
const cron = require('node-cron');

class HK01DailyCrawler extends HK01HistoricalCrawler {
    constructor(config = {}) {
        super({
            dataPath: './data/hk01_news_database.json',
            startDate: new Date().toISOString().split('T')[0], // 从今天开始
            ...config
        });
        
        this.config = {
            enableScheduler: true,
            schedule: '0 9,15,21 * * *', // 每天9:00, 15:00, 21:00执行
            realtimeCheckInterval: 30 * 60 * 1000, // 30分钟实时检查
            dailyUpdateTime: '06:00', // 每日凌晨6点更新
            maxArticlesPerDay: 100, // 每天最多爬取100篇文章
            ...this.config
        };
        
        this.isRunning = false;
        this.realtimeTimer = null;
    }
    
    /**
     * 启动每日爬虫
     */
    async startDailyCrawler() {
        if (this.isRunning) {
            console.log('⚠️ 爬虫已经在运行中');
            return;
        }
        
        this.isRunning = true;
        console.log('🚀 启动HK01每日爬虫...');
        
        // 立即执行一次爬取
        await this.crawlToday();
        
        // 设置定时任务
        if (this.config.enableScheduler) {
            this.setupScheduler();
        }
        
        // 设置实时检查
        this.setupRealtimeCheck();
        
        console.log('✅ HK01每日爬虫已启动');
    }
    
    /**
     * 停止爬虫
     */
    stopDailyCrawler() {
        this.isRunning = false;
        
        if (this.realtimeTimer) {
            clearInterval(this.realtimeTimer);
            this.realtimeTimer = null;
        }
        
        console.log('🛑 HK01每日爬虫已停止');
    }
    
    /**
     * 设置定时任务
     */
    setupScheduler() {
        cron.schedule(this.config.schedule, async () => {
            console.log('⏰ 定时任务执行: 爬取今日新闻');
            await this.crawlToday();
        });
        
        console.log(`⏰ 定时任务已设置: ${this.config.schedule}`);
    }
    
    /**
     * 设置实时检查
     */
    setupRealtimeCheck() {
        this.realtimeTimer = setInterval(async () => {
            if (this.isRunning) {
                console.log('🔍 实时检查: 搜索最新文章');
                await this.checkLatestArticles();
            }
        }, this.config.realtimeCheckInterval);
        
        console.log(`🔍 实时检查已设置: 每${this.config.realtimeCheckInterval / 60000}分钟`);
    }
    
    /**
     * 爬取今日新闻
     */
    async crawlToday() {
        const today = new Date().toISOString().split('T')[0];
        console.log(`📅 爬取今日新闻: ${today}`);
        
        try {
            const articles = await this.crawlByDate(today);
            
            if (articles.length > 0) {
                const newArticles = articles.filter(article => !this.isDuplicate(article));
                
                if (newArticles.length > 0) {
                    this.newsDatabase.articles.push(...newArticles);
                    this.saveDatabase();
                    
                    console.log(`✅ 今日新增 ${newArticles.length} 篇文章`);
                    
                    // 触发新文章通知
                    this.triggerNewArticleNotification(newArticles);
                    
                    return {
                        success: true,
                        date: today,
                        totalArticles: articles.length,
                        newArticles: newArticles.length,
                        articles: newArticles
                    };
                } else {
                    console.log('ℹ️ 今日没有新文章');
                    return {
                        success: true,
                        date: today,
                        totalArticles: articles.length,
                        newArticles: 0,
                        message: '没有新文章'
                    };
                }
            } else {
                console.log('ℹ️ 今日没有发现相关文章');
                return {
                    success: true,
                    date: today,
                    totalArticles: 0,
                    newArticles: 0,
                    message: '没有发现相关文章'
                };
            }
            
        } catch (error) {
            console.error('❌ 爬取今日新闻失败:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 检查最新文章（实时监控）
     */
    async checkLatestArticles() {
        console.log('🔍 实时检查最新文章...');
        
        const searchUrls = [
            'https://www.hk01.com/search?q=地盤+工傷',
            'https://www.hk01.com/search?q=工業+意外',
            'https://www.hk01.com/search?q=地盤+安全',
            'https://www.hk01.com/tag/15206' // 地盤工傷標籤
        ];
        
        const newArticles = [];
        
        for (const url of searchUrls) {
            try {
                await this.delay();
                
                const response = await axios({
                    method: 'GET',
                    url,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    timeout: 10000
                });
                
                const today = new Date().toISOString().split('T')[0];
                const articles = await this.extractArticlesFromSearchPage(response.data, url, today);
                
                const uniqueArticles = articles.filter(article => !this.isDuplicate(article));
                
                if (uniqueArticles.length > 0) {
                    newArticles.push(...uniqueArticles);
                    console.log(`✅ ${url}: 发现 ${uniqueArticles.length} 篇新文章`);
                }
                
            } catch (error) {
                console.log(`❌ ${url}: ${error.message}`);
            }
        }
        
        if (newArticles.length > 0) {
            this.newsDatabase.articles.push(...newArticles);
            this.saveDatabase();
            
            console.log(`🎉 实时检查发现 ${newArticles.length} 篇新文章`);
            
            // 触发新文章通知
            this.triggerNewArticleNotification(newArticles);
            
            return {
                success: true,
                newArticles: newArticles.length,
                articles: newArticles
            };
        } else {
            console.log('ℹ️ 实时检查没有发现新文章');
            return {
                success: true,
                newArticles: 0,
                message: '没有新文章'
            };
        }
    }
    
    /**
     * 触发新文章通知
     */
    triggerNewArticleNotification(articles) {
        // 这里可以集成到WhatsApp Bot的通知系统
        console.log(`📢 新文章通知: ${articles.length} 篇新文章`);
        
        articles.forEach((article, index) => {
            console.log(`   ${index + 1}. ${article.title}`);
            console.log(`      日期: ${article.publishDate}`);
            console.log(`      链接: ${article.url}`);
        });
        
        // 在实际使用中，这里会调用WhatsApp Bot的发送消息功能
        // this.sendToWhatsApp(articles);
    }
    
    /**
     * 手动触发爬取
     */
    async manualCrawl() {
        console.log('🔄 手动触发爬取...');
        return await this.crawlToday();
    }
    
    /**
     * 获取系统状态
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            database: this.getDatabaseStats(),
            config: {
                schedule: this.config.schedule,
                realtimeInterval: this.config.realtimeCheckInterval,
                enableScheduler: this.config.enableScheduler
            },
            lastCrawl: this.newsDatabase.metadata.lastUpdated
        };
    }
}

module.exports = HK01DailyCrawler;