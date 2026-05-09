/**
 * HK01历史数据爬虫
 * 爬取2026年2月至今的新闻数据，按日爬取
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

class HK01HistoricalCrawler {
    constructor(config = {}) {
        this.config = {
            dataPath: './data/hk01_news_database.json',
            startDate: '2026-02-01', // 从2026年2月开始
            endDate: new Date().toISOString().split('T')[0], // 到今天
            delayBetweenRequests: 2000, // 2秒延迟
            ...config
        };
        
        this.newsDatabase = {
            metadata: {
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                totalArticles: 0,
                dateRange: {
                    start: this.config.startDate,
                    end: this.config.endDate
                }
            },
            articles: []
        };
        
        this.loadDatabase();
    }
    
    /**
     * 加载现有数据库
     */
    loadDatabase() {
        try {
            if (fs.existsSync(this.config.dataPath)) {
                const data = JSON.parse(fs.readFileSync(this.config.dataPath, 'utf8'));
                this.newsDatabase = data;
                console.log(`📚 已加载数据库: ${this.newsDatabase.articles.length} 篇文章`);
            }
        } catch (error) {
            console.log('ℹ️ 创建新的新闻数据库');
        }
    }
    
    /**
     * 保存数据库
     */
    saveDatabase() {
        try {
            // 确保目录存在
            const dir = path.dirname(this.config.dataPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            this.newsDatabase.metadata.lastUpdated = new Date().toISOString();
            this.newsDatabase.metadata.totalArticles = this.newsDatabase.articles.length;
            
            fs.writeFileSync(this.config.dataPath, JSON.stringify(this.newsDatabase, null, 2));
            console.log(`💾 数据库已保存: ${this.newsDatabase.articles.length} 篇文章`);
        } catch (error) {
            console.error('❌ 保存数据库失败:', error.message);
        }
    }
    
    /**
     * 生成日期范围
     */
    *generateDateRange() {
        const start = new Date(this.config.startDate);
        const end = new Date(this.config.endDate);
        
        let current = new Date(start);
        while (current <= end) {
            yield current.toISOString().split('T')[0];
            current.setDate(current.getDate() + 1);
        }
    }
    
    /**
     * 按日期爬取新闻
     */
    async crawlByDate(date) {
        console.log(`📅 爬取 ${date} 的新闻...`);
        
        const searchUrls = [
            `https://www.hk01.com/search?q=地盤+工傷&date=${date}`,
            `https://www.hk01.com/search?q=工業+意外&date=${date}`,
            `https://www.hk01.com/search?q=地盤+安全&date=${date}`,
            `https://www.hk01.com/search?q=建築+意外&date=${date}`,
            `https://www.hk01.com/search?q=高空+作業&date=${date}`
        ];
        
        const articles = [];
        
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
                
                const articlesFromUrl = await this.extractArticlesFromSearchPage(response.data, url, date);
                articles.push(...articlesFromUrl);
                
                console.log(`✅ ${url}: 发现 ${articlesFromUrl.length} 篇文章`);
                
            } catch (error) {
                console.log(`❌ ${url}: ${error.message}`);
            }
        }
        
        return articles;
    }
    
    /**
     * 从搜索页面提取文章
     */
    async extractArticlesFromSearchPage(html, sourceUrl, date) {
        const $ = cheerio.load(html);
        const articles = [];
        
        // 尝试多种选择器
        const articleSelectors = [
            '.article-item',
            '.news-item',
            '.search-result-item',
            'article',
            '.card',
            '.list-item'
        ];
        
        let articlesFound = 0;
        
        for (const selector of articleSelectors) {
            $(selector).each((index, element) => {
                try {
                    const $element = $(element);
                    
                    // 提取标题和链接
                    const titleElement = $element.find('h1, h2, h3, .title, .headline').first();
                    const title = titleElement.text().trim();
                    
                    if (!title || title.length < 5) return;
                    
                    // 提取链接
                    let link = $element.find('a').first().attr('href');
                    if (link && !link.startsWith('http')) {
                        link = `https://www.hk01.com${link}`;
                    }
                    
                    // 提取描述
                    const description = $element.find('.description, .summary, .excerpt, p').first().text().trim();
                    
                    // 创建文章对象
                    const article = {
                        id: this.generateArticleId(title, date),
                        title: title,
                        url: link || sourceUrl,
                        publishDate: date,
                        source: 'HK01',
                        category: this.extractCategoryFromTitle(title),
                        keywords: this.extractKeywords(title),
                        description: description || title,
                        crawledAt: new Date().toISOString(),
                        sourceUrl: sourceUrl
                    };
                    
                    // 去重检查
                    if (!this.isDuplicate(article)) {
                        articles.push(article);
                        articlesFound++;
                    }
                    
                } catch (error) {
                    console.log(`❌ 提取文章失败: ${error.message}`);
                }
            });
            
            if (articlesFound > 0) break; // 使用第一个成功的选择器
        }
        
        return articles;
    }
    
    /**
     * 生成文章ID
     */
    generateArticleId(title, date) {
        return Buffer.from(`${date}_${title}`).toString('base64').substring(0, 16);
    }
    
    /**
     * 从标题提取分类
     */
    extractCategoryFromTitle(title) {
        const categories = {
            '地盤': 'construction',
            '工傷': 'work_injury', 
            '意外': 'accident',
            '安全': 'safety',
            '建築': 'construction',
            '高空': 'height_work',
            '倒塌': 'collapse',
            '火警': 'fire',
            '工業': 'industrial'
        };
        
        for (const [keyword, category] of Object.entries(categories)) {
            if (title.includes(keyword)) {
                return category;
            }
        }
        
        return 'general';
    }
    
    /**
     * 提取关键词
     */
    extractKeywords(title) {
        const keywords = [
            '地盤', '工傷', '意外', '安全', '建築', '高空', '倒塌', 
            '火警', '工業', '勞工', '巡查', '天秤', '塔吊', '起重機'
        ];
        
        return keywords.filter(keyword => title.includes(keyword));
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
     * 开始历史数据爬取
     */
    async startHistoricalCrawl() {
        console.log('🚀 开始历史数据爬取...');
        console.log(`📅 日期范围: ${this.config.startDate} 至 ${this.config.endDate}`);
        
        const dateGenerator = this.generateDateRange();
        let totalArticles = 0;
        
        for (const date of dateGenerator) {
            console.log(`\n📊 处理日期: ${date}`);
            
            const articles = await this.crawlByDate(date);
            
            if (articles.length > 0) {
                this.newsDatabase.articles.push(...articles);
                totalArticles += articles.length;
                console.log(`✅ ${date}: 添加 ${articles.length} 篇文章`);
                
                // 每处理10天保存一次
                if (totalArticles % 50 === 0) {
                    this.saveDatabase();
                }
            } else {
                console.log(`ℹ️ ${date}: 没有发现相关文章`);
            }
            
            await this.delay();
        }
        
        // 最终保存
        this.saveDatabase();
        
        console.log(`\n🎉 历史数据爬取完成！`);
        console.log(`📊 总共爬取: ${totalArticles} 篇文章`);
        console.log(`💾 数据库位置: ${this.config.dataPath}`);
        
        return {
            success: true,
            totalArticles: totalArticles,
            databasePath: this.config.dataPath
        };
    }
    
    /**
     * 获取数据库统计
     */
    getDatabaseStats() {
        return {
            totalArticles: this.newsDatabase.articles.length,
            dateRange: this.newsDatabase.metadata.dateRange,
            lastUpdated: this.newsDatabase.metadata.lastUpdated,
            categories: this.getCategoryStats()
        };
    }
    
    /**
     * 获取分类统计
     */
    getCategoryStats() {
        const stats = {};
        this.newsDatabase.articles.forEach(article => {
            stats[article.category] = (stats[article.category] || 0) + 1;
        });
        return stats;
    }
    
    /**
     * 根据关键词搜索文章
     */
    searchArticles(keywords, limit = 10) {
        const searchTerms = Array.isArray(keywords) ? keywords : [keywords];
        
        return this.newsDatabase.articles
            .filter(article => {
                const searchText = `${article.title} ${article.description} ${article.keywords.join(' ')}`;
                return searchTerms.some(term => 
                    searchText.toLowerCase().includes(term.toLowerCase())
                );
            })
            .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
            .slice(0, limit);
    }
    
    /**
     * 获取最近的文章
     */
    getRecentArticles(days = 7, limit = 10) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return this.newsDatabase.articles
            .filter(article => new Date(article.publishDate) >= cutoffDate)
            .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
            .slice(0, limit);
    }
}

module.exports = HK01HistoricalCrawler;