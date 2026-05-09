/**
 * HK01基于日期的爬虫
 * 使用日期直接作为分类来组织新闻
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

class HK01DateBasedCrawler {
    constructor(config = {}) {
        this.config = {
            dataPath: './data/hk01_date_based_database.json',
            delayBetweenRequests: 2000, // 2秒延迟
            maxArticlesPerDate: 50, // 每个日期最多50篇文章
            targetDate: '22/4/2026', // 目标日期
            ...config
        };
        
        this.newsDatabase = {
            metadata: {
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                totalArticles: 0,
                dateRange: {
                    start: this.formatDateForDatabase(this.config.targetDate),
                    end: this.formatDateForDatabase(this.config.targetDate)
                }
            },
            articles: [],
            dateCategories: {}
        };
        
        this.loadDatabase();
    }
    
    /**
     * 格式化日期用于数据库
     */
    formatDateForDatabase(dateStr) {
        // 支持多种日期格式
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                // 正确处理年份（假设2026年）
                const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }
        return dateStr;
    }
    
    /**
     * 格式化日期显示
     */
    formatDateForDisplay(dateStr) {
        const dbDate = this.formatDateForDatabase(dateStr);
        const date = new Date(dbDate);
        return date.toLocaleDateString('zh-HK', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }
    
    /**
     * 加载现有数据库
     */
    loadDatabase() {
        try {
            if (fs.existsSync(this.config.dataPath)) {
                const data = JSON.parse(fs.readFileSync(this.config.dataPath, 'utf8'));
                this.newsDatabase = data;
                console.log(`📚 已加载基于日期的数据库: ${this.newsDatabase.articles.length} 篇文章`);
            }
        } catch (error) {
            console.log('ℹ️ 创建新的基于日期的数据库');
        }
    }
    
    /**
     * 保存数据库
     */
    saveDatabase() {
        try {
            const dir = path.dirname(this.config.dataPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            this.newsDatabase.metadata.lastUpdated = new Date().toISOString();
            this.newsDatabase.metadata.totalArticles = this.newsDatabase.articles.length;
            
            // 更新日期分类统计
            this.updateDateCategories();
            
            fs.writeFileSync(this.config.dataPath, JSON.stringify(this.newsDatabase, null, 2));
            console.log(`💾 基于日期的数据库已保存: ${this.newsDatabase.articles.length} 篇文章`);
        } catch (error) {
            console.error('❌ 保存数据库失败:', error.message);
        }
    }
    
    /**
     * 更新日期分类统计
     */
    updateDateCategories() {
        this.newsDatabase.dateCategories = {};
        
        this.newsDatabase.articles.forEach(article => {
            const dateKey = article.publishDate;
            if (!this.newsDatabase.dateCategories[dateKey]) {
                this.newsDatabase.dateCategories[dateKey] = {
                    count: 0,
                    articles: []
                };
            }
            this.newsDatabase.dateCategories[dateKey].count++;
            this.newsDatabase.dateCategories[dateKey].articles.push(article.id);
        });
    }
    
    /**
     * 爬取指定日期的新闻
     */
    async crawlByDate(targetDate) {
        console.log(`📅 爬取日期: ${this.formatDateForDisplay(targetDate)}`);
        
        const formattedDate = this.formatDateForDatabase(targetDate);
        const searchUrls = [
            `https://www.hk01.com/search?date=${formattedDate}`,
            `https://www.hk01.com/search?q=香港&date=${formattedDate}`,
            `https://www.hk01.com/search?q=新聞&date=${formattedDate}`,
            `https://www.hk01.com/search?q=今日&date=${formattedDate}`
        ];
        
        const articles = [];
        
        for (const url of searchUrls) {
            try {
                await this.delay();
                
                console.log(`🔍 搜索: ${url}`);
                
                const response = await axios({
                    method: 'GET',
                    url: url,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    timeout: 15000
                });
                
                const extractedArticles = await this.extractArticlesFromSearchPage(response.data, url, formattedDate);
                articles.push(...extractedArticles);
                
                console.log(`✅ ${url}: 发现 ${extractedArticles.length} 篇文章`);
                
            } catch (error) {
                console.log(`❌ 搜索失败: ${error.message}`);
            }
        }
        
        return articles;
    }
    
    /**
     * 从搜索页面提取文章
     */
    async extractArticlesFromSearchPage(html, sourceUrl, targetDate) {
        const $ = cheerio.load(html);
        const articles = [];
        
        // 查找所有链接
        $('a').each((index, link) => {
            try {
                const $link = $(link);
                const href = $link.attr('href');
                const text = $link.text().trim();
                
                if (!href || !text || text.length < 10) return;
                
                // 判断是否为新闻链接
                if (href.includes('/article/') || href.includes('/society/') || 
                    href.includes('/politics/') || href.includes('/entertainment/') ||
                    (text.length > 20 && text.length < 200)) {
                    
                    let fullUrl = href;
                    if (!href.startsWith('http')) {
                        fullUrl = `https://www.hk01.com${href}`;
                    }
                    
                    // 检测文章类型
                    const articleType = this.detectArticleType(text, href);
                    
                    const article = {
                        id: this.generateArticleId(text, targetDate),
                        title: text,
                        url: fullUrl,
                        publishDate: targetDate,
                        source: 'HK01',
                        category: targetDate, // 使用日期作为分类
                        articleType: articleType,
                        description: text,
                        crawledAt: new Date().toISOString(),
                        sourceUrl: sourceUrl,
                        strategy: 'date_based'
                    };
                    
                    if (!this.isDuplicate(article)) {
                        articles.push(article);
                    }
                }
                
            } catch (error) {
                // 忽略单个链接分析错误
            }
        });
        
        return articles.slice(0, this.config.maxArticlesPerDate);
    }
    
    /**
     * 检测文章类型
     */
    detectArticleType(title, url) {
        const text = title.toLowerCase();
        
        const types = {
            '地盤': 'construction',
            '工傷': 'work_injury',
            '意外': 'accident',
            '政治': 'politics',
            '經濟': 'economy',
            '娛樂': 'entertainment',
            '體育': 'sports',
            '科技': 'technology',
            '生活': 'lifestyle',
            '社會': 'society',
            '突發': 'breaking',
            '文化': 'culture',
            '教育': 'education',
            '醫療': 'medical',
            '交通': 'transport',
            '天氣': 'weather'
        };
        
        for (const [keyword, type] of Object.entries(types)) {
            if (text.includes(keyword)) {
                return type;
            }
        }
        
        return 'general';
    }
    
    /**
     * 生成文章ID
     */
    generateArticleId(title, date) {
        return Buffer.from(`${date}_${title}`).toString('base64').substring(0, 16);
    }
    
    /**
     * 去重检查
     */
    isDuplicate(article) {
        return this.newsDatabase.articles.some(existing => 
            existing.id === article.id || 
            existing.title === article.title
        );
    }
    
    /**
     * 延迟函数
     */
    delay() {
        return new Promise(resolve => 
            setTimeout(resolve, this.config.delayBetweenRequests)
        );
    }
    
    /**
     * 爬取指定日期的所有新闻
     */
    async crawlDateNews(targetDate) {
        console.log(`🚀 开始爬取日期新闻: ${this.formatDateForDisplay(targetDate)}`);
        
        try {
            // 爬取指定日期的新闻
            const dateArticles = await this.crawlByDate(targetDate);
            
            // 去重
            const uniqueArticles = dateArticles.filter(article => !this.isDuplicate(article));
            
            if (uniqueArticles.length > 0) {
                this.newsDatabase.articles.push(...uniqueArticles);
                this.saveDatabase();
                
                console.log(`🎉 日期新闻爬取完成！`);
                console.log(`📊 总共发现: ${dateArticles.length} 篇文章`);
                console.log(`📊 去重后: ${uniqueArticles.length} 篇新文章`);
                
                // 显示文章类型统计
                const typeStats = this.getArticleTypeStats(uniqueArticles);
                console.log('📊 文章类型统计:');
                Object.entries(typeStats).forEach(([type, count]) => {
                    console.log(`   ${type}: ${count} 篇`);
                });
                
                return {
                    success: true,
                    date: targetDate,
                    formattedDate: this.formatDateForDatabase(targetDate),
                    displayDate: this.formatDateForDisplay(targetDate),
                    totalArticles: dateArticles.length,
                    newArticles: uniqueArticles.length,
                    articles: uniqueArticles,
                    typeStats: typeStats
                };
            } else {
                console.log('ℹ️ 该日期没有发现新文章');
                return {
                    success: true,
                    date: targetDate,
                    formattedDate: this.formatDateForDatabase(targetDate),
                    displayDate: this.formatDateForDisplay(targetDate),
                    totalArticles: 0,
                    newArticles: 0,
                    message: '没有发现新文章'
                };
            }
            
        } catch (error) {
            console.error('❌ 日期新闻爬取失败:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 获取文章类型统计
     */
    getArticleTypeStats(articles) {
        const stats = {};
        articles.forEach(article => {
            stats[article.articleType] = (stats[article.articleType] || 0) + 1;
        });
        return stats;
    }
    
    /**
     * 获取数据库统计
     */
    getDatabaseStats() {
        this.updateDateCategories();
        
        return {
            totalArticles: this.newsDatabase.articles.length,
            dateRange: this.newsDatabase.metadata.dateRange,
            lastUpdated: this.newsDatabase.metadata.lastUpdated,
            dateCategories: this.newsDatabase.dateCategories,
            articleTypes: this.getArticleTypeStats(this.newsDatabase.articles)
        };
    }
    
    /**
     * 根据日期搜索文章
     */
    searchArticlesByDate(date, limit = 10) {
        const formattedDate = this.formatDateForDatabase(date);
        
        return this.newsDatabase.articles
            .filter(article => article.publishDate === formattedDate)
            .sort((a, b) => b.title.localeCompare(a.title))
            .slice(0, limit);
    }
    
    /**
     * 根据文章类型搜索
     */
    searchArticlesByType(articleType, limit = 10) {
        return this.newsDatabase.articles
            .filter(article => article.articleType === articleType)
            .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
            .slice(0, limit);
    }
    
    /**
     * 获取所有日期列表
     */
    getAllDates() {
        const dates = new Set();
        this.newsDatabase.articles.forEach(article => {
            dates.add(article.publishDate);
        });
        return Array.from(dates).sort().reverse();
    }
    
    /**
     * 获取日期范围内的新闻
     */
    getNewsByDateRange(startDate, endDate, limit = 20) {
        const start = this.formatDateForDatabase(startDate);
        const end = this.formatDateForDatabase(endDate);
        
        return this.newsDatabase.articles
            .filter(article => article.publishDate >= start && article.publishDate <= end)
            .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
            .slice(0, limit);
    }
}

module.exports = HK01DateBasedCrawler;