/**
 * HK01所有新闻爬虫
 * 爬取当日的所有新闻，而不仅仅是地盘相关
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

class HK01AllNewsCrawler {
    constructor(config = {}) {
        this.config = {
            dataPath: './data/hk01_all_news_database.json',
            startDate: new Date().toISOString().split('T')[0], // 从今天开始
            endDate: new Date().toISOString().split('T')[0], // 到今天
            delayBetweenRequests: 1000, // 1秒延迟
            maxArticlesPerDay: 50, // 每天最多爬取50篇文章
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
                console.log(`📚 已加载所有新闻数据库: ${this.newsDatabase.articles.length} 篇文章`);
            }
        } catch (error) {
            console.log('ℹ️ 创建新的所有新闻数据库');
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
            console.log(`💾 所有新闻数据库已保存: ${this.newsDatabase.articles.length} 篇文章`);
        } catch (error) {
            console.error('❌ 保存数据库失败:', error.message);
        }
    }
    
    /**
     * 获取HK01主页新闻
     */
    async crawlHomePage() {
        console.log('🏠 爬取HK01主页新闻...');
        
        const homeUrl = 'https://www.hk01.com/';
        const articles = [];
        
        try {
            const response = await axios({
                method: 'GET',
                url: homeUrl,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 10000
            });
            
            const articlesFromHome = await this.extractArticlesFromHomePage(response.data, homeUrl);
            articles.push(...articlesFromHome);
            
            console.log(`✅ 主页新闻: 发现 ${articlesFromHome.length} 篇文章`);
            
        } catch (error) {
            console.log(`❌ 主页爬取失败: ${error.message}`);
        }
        
        return articles;
    }
    
    /**
     * 获取各分类新闻
     */
    async crawlCategories() {
        console.log('📰 爬取各分类新闻...');
        
        const categories = [
            { name: '社會新聞', url: 'https://www.hk01.com/society' },
            { name: '突發新聞', url: 'https://www.hk01.com/breaking' },
            { name: '政治新聞', url: 'https://www.hk01.com/politics' },
            { name: '經濟新聞', url: 'https://www.hk01.com/finance' },
            { name: '娛樂新聞', url: 'https://www.hk01.com/entertainment' },
            { name: '體育新聞', url: 'https://www.hk01.com/sports' },
            { name: '科技新聞', url: 'https://www.hk01.com/technology' },
            { name: '生活新聞', url: 'https://www.hk01.com/lifestyle' }
        ];
        
        const allArticles = [];
        
        for (const category of categories) {
            try {
                await this.delay();
                
                const response = await axios({
                    method: 'GET',
                    url: category.url,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    timeout: 10000
                });
                
                const articlesFromCategory = await this.extractArticlesFromCategoryPage(response.data, category.url, category.name);
                
                if (articlesFromCategory.length > 0) {
                    allArticles.push(...articlesFromCategory);
                    console.log(`✅ ${category.name}: 发现 ${articlesFromCategory.length} 篇文章`);
                }
                
            } catch (error) {
                console.log(`❌ ${category.name}爬取失败: ${error.message}`);
            }
        }
        
        return allArticles;
    }
    
    /**
     * 从主页提取文章
     */
    async extractArticlesFromHomePage(html, sourceUrl) {
        const $ = cheerio.load(html);
        const articles = [];
        
        // 主页文章选择器
        const selectors = [
            '.article-item',
            '.news-item',
            '.headline-item',
            '.featured-article',
            '.top-story',
            'article',
            '.card',
            '.list-item'
        ];
        
        for (const selector of selectors) {
            $(selector).each((index, element) => {
                try {
                    const $element = $(element);
                    const article = this.extractArticleInfo($element, $, 'home', sourceUrl);
                    
                    if (article && !this.isDuplicate(article)) {
                        articles.push(article);
                    }
                    
                } catch (error) {
                    console.log(`❌ 提取文章失败: ${error.message}`);
                }
            });
            
            if (articles.length > 0) break; // 使用第一个成功的选择器
        }
        
        return articles.slice(0, this.config.maxArticlesPerDay);
    }
    
    /**
     * 从分类页面提取文章
     */
    async extractArticlesFromCategoryPage(html, sourceUrl, categoryName) {
        const $ = cheerio.load(html);
        const articles = [];
        
        // 分类页面文章选择器
        const selectors = [
            '.article-item',
            '.news-item',
            '.category-item',
            '.list-item',
            'article',
            '.card'
        ];
        
        for (const selector of selectors) {
            $(selector).each((index, element) => {
                try {
                    const $element = $(element);
                    const article = this.extractArticleInfo($element, $, categoryName, sourceUrl);
                    
                    if (article && !this.isDuplicate(article)) {
                        articles.push(article);
                    }
                    
                } catch (error) {
                    console.log(`❌ 提取文章失败: ${error.message}`);
                }
            });
            
            if (articles.length > 0) break; // 使用第一个成功的选择器
        }
        
        return articles.slice(0, Math.floor(this.config.maxArticlesPerDay / 4));
    }
    
    /**
     * 提取文章信息
     */
    extractArticleInfo($element, $, category, sourceUrl) {
        // 提取标题
        const titleElement = $element.find('h1, h2, h3, .title, .headline, .article-title').first();
        const title = titleElement.text().trim();
        
        if (!title || title.length < 5) return null;
        
        // 提取链接
        let link = $element.find('a').first().attr('href');
        if (link && !link.startsWith('http')) {
            link = `https://www.hk01.com${link}`;
        }
        
        // 提取描述
        const description = $element.find('.description, .summary, .excerpt, p, .article-content').first().text().trim();
        
        // 提取图片
        const image = $element.find('img').first().attr('src');
        
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
            image: image,
            crawledAt: new Date().toISOString(),
            sourceUrl: sourceUrl
        };
        
        return article;
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
     * 爬取当日所有新闻
     */
    async crawlTodayAllNews() {
        console.log('🚀 开始爬取当日所有新闻...');
        
        const today = new Date().toISOString().split('T')[0];
        console.log(`📅 爬取日期: ${today}`);
        
        try {
            // 爬取主页新闻
            const homeArticles = await this.crawlHomePage();
            
            // 爬取分类新闻
            const categoryArticles = await this.crawlCategories();
            
            // 合并所有文章
            const allArticles = [...homeArticles, ...categoryArticles];
            
            // 去重
            const uniqueArticles = allArticles.filter(article => !this.isDuplicate(article));
            
            if (uniqueArticles.length > 0) {
                this.newsDatabase.articles.push(...uniqueArticles);
                this.saveDatabase();
                
                console.log(`🎉 当日新闻爬取完成！`);
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
            console.error('❌ 爬取当日新闻失败:', error.message);
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
}

module.exports = HK01AllNewsCrawler;