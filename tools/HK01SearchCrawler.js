/**
 * HK01搜索爬虫
 * 通过搜索功能获取当日的所有新闻
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

class HK01SearchCrawler {
    constructor(config = {}) {
        this.config = {
            dataPath: './data/hk01_search_news_database.json',
            delayBetweenRequests: 1000, // 1秒延迟
            maxArticlesPerSearch: 20, // 每个搜索最多20篇文章
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
                console.log(`📚 已加载搜索新闻数据库: ${this.newsDatabase.articles.length} 篇文章`);
            }
        } catch (error) {
            console.log('ℹ️ 创建新的搜索新闻数据库');
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
            console.log(`💾 搜索新闻数据库已保存: ${this.newsDatabase.articles.length} 篇文章`);
        } catch (error) {
            console.error('❌ 保存数据库失败:', error.message);
        }
    }
    
    /**
     * 通过搜索获取新闻
     */
    async crawlBySearch() {
        console.log('🔍 通过搜索获取当日新闻...');
        
        const searchKeywords = [
            '', // 空搜索获取最新新闻
            '香港',
            '新聞',
            '今日',
            '最新',
            '突發',
            '社會',
            '政治',
            '經濟',
            '娛樂',
            '體育',
            '科技',
            '生活',
            '地盤',
            '工傷',
            '意外',
            '安全'
        ];
        
        const allArticles = [];
        const today = new Date().toISOString().split('T')[0];
        
        for (const keyword of searchKeywords) {
            try {
                await this.delay();
                
                const searchUrl = keyword ? 
                    `https://www.hk01.com/search?q=${encodeURIComponent(keyword)}&date=${today}` :
                    `https://www.hk01.com/search?date=${today}`;
                
                console.log(`📡 搜索: ${keyword || '最新新闻'} -> ${searchUrl}`);
                
                const response = await axios({
                    method: 'GET',
                    url: searchUrl,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    timeout: 10000
                });
                
                const articlesFromSearch = await this.extractArticlesFromSearchPage(response.data, searchUrl, keyword, today);
                
                if (articlesFromSearch.length > 0) {
                    allArticles.push(...articlesFromSearch);
                    console.log(`✅ ${keyword || '最新'}: 发现 ${articlesFromSearch.length} 篇文章`);
                }
                
            } catch (error) {
                console.log(`❌ 搜索"${keyword}"失败: ${error.message}`);
            }
        }
        
        return allArticles;
    }
    
    /**
     * 从搜索页面提取文章
     */
    async extractArticlesFromSearchPage(html, sourceUrl, keyword, date) {
        const $ = cheerio.load(html);
        const articles = [];
        
        // 搜索页面文章选择器
        const selectors = [
            '.article-item',
            '.news-item',
            '.search-result-item',
            '.list-item',
            'article',
            '.card',
            '.result-item'
        ];
        
        for (const selector of selectors) {
            $(selector).each((index, element) => {
                try {
                    const $element = $(element);
                    const article = this.extractArticleInfo($element, $, keyword, sourceUrl, date);
                    
                    if (article && !this.isDuplicate(article)) {
                        articles.push(article);
                    }
                    
                } catch (error) {
                    console.log(`❌ 提取文章失败: ${error.message}`);
                }
            });
            
            if (articles.length > 0) break; // 使用第一个成功的选择器
        }
        
        return articles.slice(0, this.config.maxArticlesPerSearch);
    }
    
    /**
     * 提取文章信息
     */
    extractArticleInfo($element, $, keyword, sourceUrl, date) {
        // 提取标题
        const titleElement = $element.find('h1, h2, h3, .title, .headline, .article-title, .result-title').first();
        const title = titleElement.text().trim();
        
        if (!title || title.length < 5) return null;
        
        // 提取链接
        let link = $element.find('a').first().attr('href');
        if (link && !link.startsWith('http')) {
            link = `https://www.hk01.com${link}`;
        }
        
        // 提取描述
        const description = $element.find('.description, .summary, .excerpt, p, .article-content, .result-description').first().text().trim();
        
        // 提取时间
        const timeElement = $element.find('.time, .date, .publish-time, time, .result-date').first();
        const publishTime = timeElement.text().trim() || date;
        
        // 检测分类
        const category = this.detectCategory(title, description, keyword);
        
        // 创建文章对象
        const article = {
            id: this.generateArticleId(title, publishTime),
            title: title,
            url: link || sourceUrl,
            publishDate: publishTime,
            source: 'HK01',
            category: category,
            searchKeyword: keyword || '最新',
            keywords: this.extractKeywords(title, description),
            description: description || title,
            crawledAt: new Date().toISOString(),
            sourceUrl: sourceUrl
        };
        
        return article;
    }
    
    /**
     * 检测分类
     */
    detectCategory(title, description, keyword) {
        const text = `${title} ${description}`.toLowerCase();
        
        const categories = {
            '地盤': 'construction',
            '工傷': 'work_injury',
            '意外': 'accident',
            '安全': 'safety',
            '政治': 'politics',
            '經濟': 'economy',
            '娛樂': 'entertainment',
            '體育': 'sports',
            '科技': 'technology',
            '生活': 'lifestyle',
            '社會': 'society',
            '突發': 'breaking',
            '新聞': 'news'
        };
        
        // 首先根据关键词判断
        if (keyword && categories[keyword]) {
            return categories[keyword];
        }
        
        // 然后根据内容判断
        for (const [keyword, category] of Object.entries(categories)) {
            if (text.includes(keyword)) {
                return category;
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
        console.log('🚀 开始通过搜索爬取当日所有新闻...');
        
        const today = new Date().toISOString().split('T')[0];
        console.log(`📅 爬取日期: ${today}`);
        
        try {
            // 通过搜索获取新闻
            const searchArticles = await this.crawlBySearch();
            
            // 去重
            const uniqueArticles = searchArticles.filter(article => !this.isDuplicate(article));
            
            if (uniqueArticles.length > 0) {
                this.newsDatabase.articles.push(...uniqueArticles);
                this.saveDatabase();
                
                console.log(`🎉 当日新闻爬取完成！`);
                console.log(`📊 总共发现: ${searchArticles.length} 篇文章`);
                console.log(`📊 去重后: ${uniqueArticles.length} 篇新文章`);
                
                return {
                    success: true,
                    date: today,
                    totalArticles: searchArticles.length,
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

module.exports = HK01SearchCrawler;