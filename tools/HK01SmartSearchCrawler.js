/**
 * HK01智能搜索爬虫
 * 使用多种策略获取当日的所有新闻
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

class HK01SmartSearchCrawler {
    constructor(config = {}) {
        this.config = {
            dataPath: './data/hk01_smart_news_database.json',
            delayBetweenRequests: 1500, // 1.5秒延迟
            maxArticlesPerStrategy: 15, // 每个策略最多15篇文章
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
                console.log(`📚 已加载智能新闻数据库: ${this.newsDatabase.articles.length} 篇文章`);
            }
        } catch (error) {
            console.log('ℹ️ 创建新的智能新闻数据库');
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
            console.log(`💾 智能新闻数据库已保存: ${this.newsDatabase.articles.length} 篇文章`);
        } catch (error) {
            console.error('❌ 保存数据库失败:', error.message);
        }
    }
    
    /**
     * 策略1: 使用通用搜索获取新闻
     */
    async strategyGeneralSearch() {
        console.log('🔍 策略1: 通用搜索获取新闻...');
        
        const searchUrls = [
            'https://www.hk01.com/search',
            'https://www.hk01.com/search?q=香港',
            'https://www.hk01.com/search?q=新聞',
            'https://www.hk01.com/search?q=今日',
            'https://www.hk01.com/search?q=最新'
        ];
        
        const articles = [];
        
        for (const url of searchUrls) {
            try {
                await this.delay();
                
                console.log(`📡 访问: ${url}`);
                
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
                
                const extractedArticles = await this.extractArticlesFromPage(response.data, url, 'general');
                articles.push(...extractedArticles);
                
                console.log(`✅ ${url}: 发现 ${extractedArticles.length} 篇文章`);
                
            } catch (error) {
                console.log(`❌ 访问失败: ${error.message}`);
            }
        }
        
        return articles;
    }
    
    /**
     * 策略2: 使用分类标签获取新闻
     */
    async strategyCategoryTags() {
        console.log('🏷️ 策略2: 分类标签获取新闻...');
        
        const categoryUrls = [
            'https://www.hk01.com/channel/2/社會新聞',
            'https://www.hk01.com/channel/310/突發',
            'https://www.hk01.com/channel/4/政治',
            'https://www.hk01.com/channel/6/經濟',
            'https://www.hk01.com/channel/8/娛樂',
            'https://www.hk01.com/channel/10/體育',
            'https://www.hk01.com/channel/12/科技',
            'https://www.hk01.com/channel/296/生活'
        ];
        
        const articles = [];
        
        for (const url of categoryUrls) {
            try {
                await this.delay();
                
                console.log(`📡 访问分类: ${url}`);
                
                const response = await axios({
                    method: 'GET',
                    url: url,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    timeout: 15000
                });
                
                const categoryName = this.extractCategoryFromUrl(url);
                const extractedArticles = await this.extractArticlesFromPage(response.data, url, categoryName);
                articles.push(...extractedArticles);
                
                console.log(`✅ ${categoryName}: 发现 ${extractedArticles.length} 篇文章`);
                
            } catch (error) {
                console.log(`❌ 分类访问失败: ${error.message}`);
            }
        }
        
        return articles;
    }
    
    /**
     * 策略3: 使用RSS或API获取新闻
     */
    async strategyRSSAndAPI() {
        console.log('📡 策略3: RSS和API获取新闻...');
        
        const apiUrls = [
            'https://www.hk01.com/api/v2/articles?page=1&limit=20',
            'https://www.hk01.com/rss',
            'https://www.hk01.com/sitemap.xml'
        ];
        
        const articles = [];
        
        for (const url of apiUrls) {
            try {
                await this.delay();
                
                console.log(`📡 尝试API: ${url}`);
                
                const response = await axios({
                    method: 'GET',
                    url: url,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    timeout: 10000
                });
                
                // 尝试解析JSON或XML
                if (url.includes('api')) {
                    const apiArticles = this.parseAPIResponse(response.data);
                    articles.push(...apiArticles);
                } else if (url.includes('rss') || url.includes('sitemap')) {
                    const feedArticles = this.parseFeedResponse(response.data);
                    articles.push(...feedArticles);
                }
                
                console.log(`✅ ${url}: 发现 ${articles.length} 篇文章`);
                
            } catch (error) {
                console.log(`❌ API访问失败: ${error.message}`);
            }
        }
        
        return articles;
    }
    
    /**
     * 从页面提取文章
     */
    async extractArticlesFromPage(html, sourceUrl, category) {
        const $ = cheerio.load(html);
        const articles = [];
        
        // 多种选择器尝试
        const selectors = [
            'article',
            '.article-item',
            '.news-item',
            '.card',
            '.list-item',
            '.headline',
            '.story',
            '.post',
            '.entry',
            '.content-item'
        ];
        
        for (const selector of selectors) {
            $(selector).each((index, element) => {
                try {
                    const $element = $(element);
                    const article = this.extractArticleInfo($element, $, category, sourceUrl);
                    
                    if (article && !this.isDuplicate(article)) {
                        articles.push(article);
                    }
                    
                } catch (error) {
                    // 忽略单个元素提取错误
                }
            });
            
            if (articles.length > 0) {
                console.log(`✅ 使用选择器 "${selector}" 找到 ${articles.length} 篇文章`);
                break;
            }
        }
        
        return articles.slice(0, this.config.maxArticlesPerStrategy);
    }
    
    /**
     * 提取文章信息
     */
    extractArticleInfo($element, $, category, sourceUrl) {
        // 提取标题
        const titleElement = $element.find('h1, h2, h3, .title, .headline, a').first();
        const title = titleElement.text().trim();
        
        if (!title || title.length < 5) return null;
        
        // 提取链接
        let link = $element.find('a').first().attr('href');
        if (link && !link.startsWith('http')) {
            link = `https://www.hk01.com${link}`;
        }
        
        // 提取描述
        const description = $element.find('.description, .summary, .excerpt, p').first().text().trim();
        
        // 提取时间
        const timeElement = $element.find('.time, .date, .publish-time, time').first();
        const publishTime = timeElement.text().trim() || new Date().toISOString().split('T')[0];
        
        // 创建文章对象
        const article = {
            id: this.generateArticleId(title, publishTime),
            title: title,
            url: link || sourceUrl,
            publishDate: publishTime,
            source: 'HK01',
            category: category,
            subcategory: this.detectSubcategory(title, description),
            keywords: this.extractKeywords(title, description),
            description: description || title,
            crawledAt: new Date().toISOString(),
            sourceUrl: sourceUrl,
            strategy: 'smart_search'
        };
        
        return article;
    }
    
    /**
     * 从URL提取分类名称
     */
    extractCategoryFromUrl(url) {
        const categoryMap = {
            '社會新聞': 'society',
            '突發': 'breaking',
            '政治': 'politics',
            '經濟': 'economy',
            '娛樂': 'entertainment',
            '體育': 'sports',
            '科技': 'technology',
            '生活': 'lifestyle'
        };
        
        for (const [chinese, english] of Object.entries(categoryMap)) {
            if (url.includes(chinese)) {
                return english;
            }
        }
        
        return 'general';
    }
    
    /**
     * 解析API响应
     */
    parseAPIResponse(data) {
        const articles = [];
        
        try {
            // 尝试解析JSON格式
            if (typeof data === 'object') {
                if (data.articles && Array.isArray(data.articles)) {
                    data.articles.forEach(item => {
                        const article = {
                            id: item.id || this.generateArticleId(item.title, item.publishDate),
                            title: item.title,
                            url: item.url,
                            publishDate: item.publishDate,
                            source: 'HK01',
                            category: item.category || 'general',
                            description: item.description || item.title,
                            crawledAt: new Date().toISOString(),
                            strategy: 'api'
                        };
                        articles.push(article);
                    });
                }
            }
        } catch (error) {
            console.log('❌ API解析失败');
        }
        
        return articles;
    }
    
    /**
     * 解析Feed响应
     */
    parseFeedResponse(data) {
        const articles = [];
        
        try {
            const $ = cheerio.load(data, { xmlMode: true });
            
            // 解析RSS
            $('item').each((index, element) => {
                const $element = $(element);
                const title = $element.find('title').text();
                const link = $element.find('link').text();
                const description = $element.find('description').text();
                const pubDate = $element.find('pubDate').text();
                
                if (title) {
                    const article = {
                        id: this.generateArticleId(title, pubDate),
                        title: title,
                        url: link,
                        publishDate: pubDate,
                        source: 'HK01',
                        category: 'rss',
                        description: description,
                        crawledAt: new Date().toISOString(),
                        strategy: 'rss'
                    };
                    articles.push(article);
                }
            });
            
        } catch (error) {
            console.log('❌ Feed解析失败');
        }
        
        return articles;
    }
    
    /**
     * 检测子分类
     */
    detectSubcategory(title, description) {
        const text = `${title} ${description}`.toLowerCase();
        
        const subcategories = {
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
            '突發': 'breaking'
        };
        
        for (const [keyword, subcategory] of Object.entries(subcategories)) {
            if (text.includes(keyword)) {
                return subcategory;
            }
        }
        
        return 'general';
    }
    
    /**
     * 提取关键词
     */
    extractKeywords(title, description) {
        const text = `${title} ${description}`;
        const keywords = [
            '地盤', '工傷', '意外', '安全', '建築', '高空', '倒塌', '火警', '工業',
            '政治', '經濟', '娛樂', '體育', '科技', '生活', '社會', '突發', '新聞',
            '香港', '政府', '政策', '法律', '教育', '醫療', '交通', '環境', '天氣'
        ];
        
        return keywords.filter(keyword => text.includes(keyword));
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
     * 智能爬取当日所有新闻
     */
    async crawlTodayAllNews() {
        console.log('🚀 开始智能爬取当日所有新闻...');
        
        const today = new Date().toISOString().split('T')[0];
        console.log(`📅 爬取日期: ${today}`);
        
        try {
            // 使用多种策略获取新闻
            const strategy1Articles = await this.strategyGeneralSearch();
            await this.delay();
            
            const strategy2Articles = await this.strategyCategoryTags();
            await this.delay();
            
            const strategy3Articles = await this.strategyRSSAndAPI();
            
            // 合并所有文章
            const allArticles = [...strategy1Articles, ...strategy2Articles, ...strategy3Articles];
            
            // 去重
            const uniqueArticles = allArticles.filter(article => !this.isDuplicate(article));
            
            if (uniqueArticles.length > 0) {
                this.newsDatabase.articles.push(...uniqueArticles);
                this.saveDatabase();
                
                console.log(`🎉 智能爬取完成！`);
                console.log(`📊 策略1 (通用搜索): ${strategy1Articles.length} 篇`);
                console.log(`📊 策略2 (分类标签): ${strategy2Articles.length} 篇`);
                console.log(`📊 策略3 (RSS/API): ${strategy3Articles.length} 篇`);
                console.log(`📊 总共发现: ${allArticles.length} 篇文章`);
                console.log(`📊 去重后: ${uniqueArticles.length} 篇新文章`);
                
                return {
                    success: true,
                    date: today,
                    totalArticles: allArticles.length,
                    newArticles: uniqueArticles.length,
                    articles: uniqueArticles,
                    strategyStats: {
                        generalSearch: strategy1Articles.length,
                        categoryTags: strategy2Articles.length,
                        rssApi: strategy3Articles.length
                    },
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
            console.error('❌ 智能爬取失败:', error.message);
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
                const searchText = `${article.title} ${article.description} ${article.keywords.join(' ')}`;
                return searchTerms.some(term => 
                    searchText.toLowerCase().includes(term.toLowerCase())
                );
            })
            .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
            .slice(0, limit);
    }
    
    /**
     * 获取当日新闻摘要
     */
    getTodayNewsSummary() {
        const today = new Date().toISOString().split('T')[0];
        const todayArticles = this.newsDatabase.articles.filter(article => 
            article.publishDate === today
        );
        
        return {
            date: today,
            totalArticles: todayArticles.length,
            categories: this.getCategoryStats(),
            articles: todayArticles.slice(0, 10)
        };
    }
}

module.exports = HK01SmartSearchCrawler;