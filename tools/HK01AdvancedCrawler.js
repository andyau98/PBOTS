/**
 * HK01高级爬虫
 * 针对HK01新页面结构的专门爬虫
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

class HK01AdvancedCrawler {
    constructor(config = {}) {
        this.config = {
            dataPath: './data/hk01_advanced_news_database.json',
            delayBetweenRequests: 2000, // 2秒延迟
            maxArticlesPerPage: 30, // 每页最多30篇文章
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
                console.log(`📚 已加载高级新闻数据库: ${this.newsDatabase.articles.length} 篇文章`);
            }
        } catch (error) {
            console.log('ℹ️ 创建新的高级新闻数据库');
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
            
            fs.writeFileSync(this.config.dataPath, JSON.stringify(this.newsDatabase, null, 2));
            console.log(`💾 高级新闻数据库已保存: ${this.newsDatabase.articles.length} 篇文章`);
        } catch (error) {
            console.error('❌ 保存数据库失败:', error.message);
        }
    }
    
    /**
     * 分析HK01页面结构
     */
    async analyzePageStructure(url) {
        console.log(`🔍 分析页面结构: ${url}`);
        
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
            
            // 分析页面结构
            const structure = {
                title: $('title').text(),
                metaDescription: $('meta[name="description"]').attr('content'),
                h1Count: $('h1').length,
                h2Count: $('h2').length,
                h3Count: $('h3').length,
                linkCount: $('a').length,
                scriptCount: $('script').length,
                divCount: $('div').length,
                hasNextData: $('script#__NEXT_DATA__').length > 0,
                hasJsonLd: $('script[type="application/ld+json"]').length > 0
            };
            
            console.log('📊 页面结构分析:');
            console.log(JSON.stringify(structure, null, 2));
            
            // 查找可能的文章容器
            const possibleContainers = [];
            $('div').each((index, element) => {
                const $div = $(element);
                const className = $div.attr('class');
                const id = $div.attr('id');
                
                if (className && (className.includes('article') || className.includes('news') || 
                    className.includes('story') || className.includes('card') || 
                    className.includes('item') || className.includes('content'))) {
                    possibleContainers.push({
                        index: index,
                        class: className,
                        id: id,
                        textLength: $div.text().length,
                        linkCount: $div.find('a').length
                    });
                }
            });
            
            console.log(`🔍 找到 ${possibleContainers.length} 个可能的文章容器`);
            
            // 显示前5个可能的容器
            possibleContainers.slice(0, 5).forEach(container => {
                console.log(`   容器 ${container.index}: class="${container.class}", 文本长度=${container.textLength}, 链接=${container.linkCount}`);
            });
            
            return { structure, possibleContainers };
            
        } catch (error) {
            console.log(`❌ 页面分析失败: ${error.message}`);
            return null;
        }
    }
    
    /**
     * 使用高级策略提取文章
     */
    async extractArticlesAdvanced(url, category) {
        console.log(`🔍 高级提取: ${url}`);
        
        try {
            const response = await axios({
                method: 'GET',
                url: url,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 15000
            });
            
            const $ = cheerio.load(response.data);
            const articles = [];
            
            // 策略1: 查找包含新闻链接的容器
            const newsContainers = $('div').filter((index, element) => {
                const $div = $(element);
                const text = $div.text();
                const links = $div.find('a');
                
                // 判断是否为新闻容器的条件
                return links.length >= 1 && 
                       text.length > 50 && 
                       text.length < 5000 &&
                       $div.find('h1, h2, h3, h4').length > 0;
            });
            
            console.log(`📰 找到 ${newsContainers.length} 个新闻容器`);
            
            // 从每个容器中提取文章信息
            newsContainers.each((index, container) => {
                try {
                    const $container = $(container);
                    
                    // 查找标题
                    const titleElement = $container.find('h1, h2, h3, h4, a').first();
                    const title = titleElement.text().trim();
                    
                    if (!title || title.length < 5) return;
                    
                    // 查找链接
                    let link = titleElement.attr('href');
                    if (link && !link.startsWith('http')) {
                        link = `https://www.hk01.com${link}`;
                    }
                    
                    // 查找描述
                    const description = $container.text().replace(title, '').trim().substring(0, 200);
                    
                    // 查找时间
                    const timeText = $container.text().match(/\d{4}-\d{2}-\d{2}|\d{2}:\d{2}/);
                    const publishTime = timeText ? timeText[0] : new Date().toISOString().split('T')[0];
                    
                    const article = {
                        id: this.generateArticleId(title, publishTime),
                        title: title,
                        url: link || url,
                        publishDate: publishTime,
                        source: 'HK01',
                        category: category,
                        description: description,
                        crawledAt: new Date().toISOString(),
                        sourceUrl: url,
                        strategy: 'advanced'
                    };
                    
                    if (!this.isDuplicate(article)) {
                        articles.push(article);
                    }
                    
                } catch (error) {
                    // 忽略单个元素提取错误
                }
            });
            
            // 策略2: 直接查找所有链接并分析
            if (articles.length === 0) {
                console.log('🔗 尝试策略2: 分析所有链接');
                
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
                            
                            const article = {
                                id: this.generateArticleId(text, new Date().toISOString().split('T')[0]),
                                title: text,
                                url: fullUrl,
                                publishDate: new Date().toISOString().split('T')[0],
                                source: 'HK01',
                                category: category,
                                description: text,
                                crawledAt: new Date().toISOString(),
                                sourceUrl: url,
                                strategy: 'link_analysis'
                            };
                            
                            if (!this.isDuplicate(article)) {
                                articles.push(article);
                            }
                        }
                        
                    } catch (error) {
                        // 忽略单个链接分析错误
                    }
                });
            }
            
            console.log(`✅ 高级提取完成: ${articles.length} 篇文章`);
            return articles.slice(0, this.config.maxArticlesPerPage);
            
        } catch (error) {
            console.log(`❌ 高级提取失败: ${error.message}`);
            return [];
        }
    }
    
    /**
     * 爬取主页新闻
     */
    async crawlHomePage() {
        console.log('🏠 爬取主页新闻...');
        
        const homeUrl = 'https://www.hk01.com/';
        
        // 先分析页面结构
        const analysis = await this.analyzePageStructure(homeUrl);
        
        if (analysis) {
            // 使用高级策略提取文章
            const articles = await this.extractArticlesAdvanced(homeUrl, 'home');
            return articles;
        }
        
        return [];
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
                
                // 分析页面结构
                const analysis = await this.analyzePageStructure(categoryInfo.url);
                
                if (analysis) {
                    // 使用高级策略提取文章
                    const articles = await this.extractArticlesAdvanced(categoryInfo.url, categoryInfo.category);
                    
                    if (articles.length > 0) {
                        allArticles.push(...articles);
                        console.log(`✅ ${categoryInfo.category}: 发现 ${articles.length} 篇文章`);
                    }
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
        console.log('🚀 开始高级爬取当日所有新闻...');
        
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
                
                console.log(`🎉 高级爬取完成！`);
                console.log(`📊 主页新闻: ${homeArticles.length} 篇`);
                console.log(`📊 分类新闻: ${categoryArticles.length} 篇`);
                console.log(`📊 总共发现: ${allArticles.length} 篇文章`);
                console.log(`📊 去重后: ${uniqueArticles.length} 篇新文章`);
                
                return {
                    success: true,
                    date: today,
                    totalArticles: allArticles.length,
                    newArticles: uniqueArticles.length,
                    articles: uniqueArticles,
                    categories: this.getCategoryStats()
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
            console.error('❌ 高级爬取失败:', error.message);
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
     * 根据分类搜索文章
     */
    searchArticlesByCategory(category, limit = 10) {
        return this.newsDatabase.articles
            .filter(article => article.category === category)
            .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
            .slice(0, limit);
    }
    
    /**
     * 根据关键词搜索文章
     */
    searchArticles(keywords, limit = 10) {
        const searchTerms = Array.isArray(keywords) ? keywords : [keywords];
        
        return this.newsDatabase.articles
            .filter(article => {
                const searchText = `${article.title} ${article.description}`;
                return searchTerms.some(term => 
                    searchText.toLowerCase().includes(term.toLowerCase())
                );
            })
            .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
            .slice(0, limit);
    }
}

module.exports = HK01AdvancedCrawler;