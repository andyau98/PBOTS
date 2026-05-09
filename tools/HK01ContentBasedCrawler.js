/**
 * HK01基于内容的爬虫
 * 通过分析页面内容获取新闻，不使用日期搜索
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

class HK01ContentBasedCrawler {
    constructor(config = {}) {
        this.config = {
            dataPath: './data/hk01_content_based_database.json',
            delayBetweenRequests: 2000, // 2秒延迟
            maxArticlesPerPage: 50, // 每页最多50篇文章
            ...config
        };
        
        this.newsDatabase = {
            metadata: {
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                totalArticles: 0,
                dateRange: {
                    start: new Date().toISOString().split('T')[0],
                    end: new Date().toISOString().split('T')[0]
                }
            },
            articles: [],
            dateCategories: {}
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
                console.log(`📚 已加载基于内容的数据库: ${this.newsDatabase.articles.length} 篇文章`);
            }
        } catch (error) {
            console.log('ℹ️ 创建新的基于内容的数据库');
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
            console.log(`💾 基于内容的数据库已保存: ${this.newsDatabase.articles.length} 篇文章`);
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
     * 分析HK01页面获取新闻
     */
    async analyzePageForNews(url, category) {
        console.log(`🔍 分析页面获取新闻: ${url}`);
        
        try {
            const response = await axios({
                method: 'GET',
                url: url,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'zh-HK,zh;q=0.9,en;q=0.8'
                },
                timeout: 15000
            });
            
            const $ = cheerio.load(response.data);
            const articles = [];
            
            // 策略1: 查找所有包含新闻内容的链接
            $('a').each((index, link) => {
                try {
                    const $link = $(link);
                    const href = $link.attr('href');
                    const text = $link.text().trim();
                    
                    if (!href || !text || text.length < 10) return;
                    
                    // 判断是否为新闻链接
                    if (this.isNewsLink(href, text)) {
                        let fullUrl = href;
                        if (!href.startsWith('http')) {
                            fullUrl = `https://www.hk01.com${href}`;
                        }
                        
                        // 提取日期信息
                        const publishDate = this.extractDateFromText(text) || new Date().toISOString().split('T')[0];
                        
                        // 检测文章类型
                        const articleType = this.detectArticleType(text);
                        
                        const article = {
                            id: this.generateArticleId(text, publishDate),
                            title: text,
                            url: fullUrl,
                            publishDate: publishDate,
                            source: 'HK01',
                            category: category,
                            articleType: articleType,
                            description: text,
                            crawledAt: new Date().toISOString(),
                            sourceUrl: url,
                            strategy: 'content_analysis'
                        };
                        
                        if (!this.isDuplicate(article)) {
                            articles.push(article);
                        }
                    }
                    
                } catch (error) {
                    // 忽略单个链接分析错误
                }
            });
            
            console.log(`✅ 分析完成: 发现 ${articles.length} 篇文章`);
            return articles.slice(0, this.config.maxArticlesPerPage);
            
        } catch (error) {
            console.log(`❌ 页面分析失败: ${error.message}`);
            return [];
        }
    }
    
    /**
     * 判断是否为新闻链接
     */
    isNewsLink(href, text) {
        // 链接包含文章路径
        if (href.includes('/article/') || href.includes('/society/') || 
            href.includes('/politics/') || href.includes('/entertainment/') ||
            href.includes('/sports/') || href.includes('/technology/') ||
            href.includes('/lifestyle/')) {
            return true;
        }
        
        // 文本长度适中，可能是新闻标题
        if (text.length > 20 && text.length < 200) {
            return true;
        }
        
        // 包含新闻关键词
        const newsKeywords = ['新聞', '報道', '消息', '事件', '事故', '發展', '政策', '措施'];
        return newsKeywords.some(keyword => text.includes(keyword));
    }
    
    /**
     * 从文本中提取日期
     */
    extractDateFromText(text) {
        // 匹配日期格式：2026-04-22, 22/4/2026, 2026年4月22日等
        const datePatterns = [
            /(\d{4})-(\d{1,2})-(\d{1,2})/g, // 2026-04-22
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/g, // 22/4/2026
            /(\d{4})年(\d{1,2})月(\d{1,2})日/g, // 2026年4月22日
            /(\d{1,2})-(\d{1,2})-(\d{4})/g // 22-04-2026
        ];
        
        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                return this.normalizeDate(match[0]);
            }
        }
        
        return null;
    }
    
    /**
     * 标准化日期格式
     */
    normalizeDate(dateStr) {
        // 统一转换为YYYY-MM-DD格式
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        } else if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                if (parts[0].length === 4) {
                    return dateStr; // 已经是YYYY-MM-DD格式
                } else {
                    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }
        } else if (dateStr.includes('年') && dateStr.includes('月') && dateStr.includes('日')) {
            const year = dateStr.match(/(\d{4})年/)[1];
            const month = dateStr.match(/(\d{1,2})月/)[1].padStart(2, '0');
            const day = dateStr.match(/(\d{1,2})日/)[1].padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        
        return dateStr;
    }
    
    /**
     * 检测文章类型
     */
    detectArticleType(text) {
        const lowerText = text.toLowerCase();
        
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
            if (lowerText.includes(keyword)) {
                return type;
            }
        }
        
        return 'general';
    }
    
    /**
     * 爬取主页新闻
     */
    async crawlHomePage() {
        console.log('🏠 爬取主页新闻...');
        
        const homeUrl = 'https://www.hk01.com/';
        const articles = await this.analyzePageForNews(homeUrl, 'home');
        
        if (articles.length > 0) {
            console.log(`✅ 主页新闻: 发现 ${articles.length} 篇文章`);
        }
        
        return articles;
    }
    
    /**
     * 爬取分类页面
     */
    async crawlCategoryPages() {
        console.log('📰 爬取分类页面...');
        
        const categoryUrls = [
            { url: 'https://www.hk01.com/channel/2/社會新聞', category: 'society' },
            { url: 'https://www.hk01.com/channel/4/政治', category: 'politics' },
            { url: 'https://www.hk01.com/channel/6/經濟', category: 'economy' },
            { url: 'https://www.hk01.com/channel/8/娛樂', category: 'entertainment' },
            { url: 'https://www.hk01.com/channel/10/體育', category: 'sports' },
            { url: 'https://www.hk01.com/channel/12/科技', category: 'technology' },
            { url: 'https://www.hk01.com/channel/296/生活', category: 'lifestyle' }
        ];
        
        const allArticles = [];
        
        for (const categoryInfo of categoryUrls) {
            try {
                await this.delay();
                
                console.log(`📡 爬取分类: ${categoryInfo.category}`);
                
                const articles = await this.analyzePageForNews(categoryInfo.url, categoryInfo.category);
                
                if (articles.length > 0) {
                    allArticles.push(...articles);
                    console.log(`✅ ${categoryInfo.category}: 发现 ${articles.length} 篇文章`);
                }
                
            } catch (error) {
                console.log(`❌ ${categoryInfo.category}爬取失败: ${error.message}`);
            }
        }
        
        return allArticles;
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
     * 爬取当日所有新闻
     */
    async crawlTodayAllNews() {
        console.log('🚀 开始基于内容爬取当日所有新闻...');
        
        const today = new Date().toISOString().split('T')[0];
        console.log(`📅 爬取日期: ${today}`);
        
        try {
            // 爬取主页新闻
            const homeArticles = await this.crawlHomePage();
            
            // 爬取分类页面新闻
            const categoryArticles = await this.crawlCategoryPages();
            
            // 合并所有文章
            const allArticles = [...homeArticles, ...categoryArticles];
            
            // 去重
            const uniqueArticles = allArticles.filter(article => !this.isDuplicate(article));
            
            if (uniqueArticles.length > 0) {
                this.newsDatabase.articles.push(...uniqueArticles);
                this.saveDatabase();
                
                console.log(`🎉 基于内容爬取完成！`);
                console.log(`📊 主页新闻: ${homeArticles.length} 篇`);
                console.log(`📊 分类新闻: ${categoryArticles.length} 篇`);
                console.log(`📊 总共发现: ${allArticles.length} 篇文章`);
                console.log(`📊 去重后: ${uniqueArticles.length} 篇新文章`);
                
                // 显示日期统计
                const dateStats = this.newsDatabase.dateCategories;
                console.log('📅 日期分类统计:');
                Object.entries(dateStats).forEach(([date, data]) => {
                    console.log(`   ${date}: ${data.count} 篇文章`);
                });
                
                return {
                    success: true,
                    date: today,
                    totalArticles: allArticles.length,
                    newArticles: uniqueArticles.length,
                    articles: uniqueArticles,
                    dateCategories: dateStats
                };
            } else {
                console.log('ℹ️ 当日没有发现新文章');
                return {
                    success: true,
                    date: today,
                    totalArticles: 0,
                    newArticles: 0,
                    message: '没有发现新文章'
                };
            }
            
        } catch (error) {
            console.error('❌ 基于内容爬取失败:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
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
            dateCategories: this.newsDatabase.dateCategories
        };
    }
    
    /**
     * 根据日期搜索文章
     */
    searchArticlesByDate(date, limit = 10) {
        const formattedDate = this.normalizeDate(date);
        
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
}

module.exports = HK01ContentBasedCrawler;