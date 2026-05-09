// 分析HK01搜索网址结构
const https = require('https');

// 您提供的搜索网址
const searchUrl = 'https://www.hk01.com/search?q=%E5%9C%B0%E7%9B%A4';

async function analyzeSearchStructure() {
    console.log('🔍 分析HK01搜索网址结构...\n');
    
    // 分析搜索URL
    console.log('📋 搜索URL分析:');
    analyzeSearchUrl(searchUrl);
    
    // 获取搜索页面内容
    console.log('\n🔍 获取搜索页面内容...');
    await fetchAndAnalyzeSearchPage(searchUrl);
    
    // 生成完整的爬虫流程
    console.log('\n🚀 完整的三次爬虫流程:');
    generateCrawlerWorkflow();
}

function analyzeSearchUrl(url) {
    console.log(`   搜索URL: ${url}`);
    
    // URL解码
    const decodedUrl = decodeURIComponent(url);
    console.log(`   解码URL: ${decodedUrl}`);
    
    // 解析URL参数
    const urlObj = new URL(url);
    console.log('   📊 URL参数分析:');
    console.log(`      协议: ${urlObj.protocol}`);
    console.log(`      域名: ${urlObj.hostname}`);
    console.log(`      路径: ${urlObj.pathname}`);
    
    // 查询参数
    console.log('      查询参数:');
    urlObj.searchParams.forEach((value, key) => {
        console.log(`        ${key}: ${value} → ${decodeURIComponent(value)}`);
    });
    
    // 生成其他关键词的搜索URL
    console.log('\n   🔧 生成其他关键词搜索URL:');
    const keywords = ['工業意外', '建築安全', '工地意外', '施工安全'];
    keywords.forEach(keyword => {
        const encodedKeyword = encodeURIComponent(keyword);
        const newUrl = `https://www.hk01.com/search?q=${encodedKeyword}`;
        console.log(`      ${keyword}: ${newUrl}`);
    });
}

async function fetchAndAnalyzeSearchPage(url) {
    try {
        console.log(`   📄 获取搜索页面: ${url}`);
        
        const html = await fetchPage(url);
        console.log(`   ✅ 成功获取页面 (${html.length} 字节)`);
        
        // 分析页面结构
        console.log('\n   🔍 分析搜索页面结构:');
        
        // 检查是否包含搜索结果
        const hasResults = html.includes('search-results') || html.includes('result') || html.includes('article');
        console.log(`      包含搜索结果: ${hasResults ? '✅' : '❌'}`);
        
        // 检查是否包含新闻链接
        const hasNewsLinks = html.includes('/社會新聞/') || html.includes('/港聞/') || html.includes('/article/');
        console.log(`      包含新闻链接: ${hasNewsLinks ? '✅' : '❌'}`);
        
        // 提取可能的新闻链接
        console.log('\n   🔍 尝试提取新闻链接...');
        const newsLinks = extractNewsLinksFromSearch(html);
        console.log(`      找到 ${newsLinks.length} 个可能的新闻链接`);
        
        if (newsLinks.length > 0) {
            console.log('      📋 新闻链接示例:');
            newsLinks.slice(0, 3).forEach((link, index) => {
                console.log(`         ${index + 1}. ${link.title}`);
                console.log(`             链接: ${link.url}`);
            });
        }
        
        // 检查页面类型
        console.log('\n   🔍 页面类型分析:');
        if (html.includes('No results found') || html.includes('没有找到结果')) {
            console.log('      ❌ 搜索结果为空');
        } else if (html.includes('search?q=')) {
            console.log('      ✅ 搜索页面');
        } else {
            console.log('      ⚠️ 未知页面类型');
        }
        
    } catch (error) {
        console.log(`   ❌ 获取搜索页面失败: ${error.message}`);
    }
}

function extractNewsLinksFromSearch(html) {
    const links = [];
    
    try {
        // 查找新闻链接模式
        const linkPatterns = [
            /<a[^>]*href="([^"]*\/社會新聞\/\d+[^"]*)"[^>]*>([^<]+)<\/a>/gi,
            /<a[^>]*href="([^"]*\/港聞\/\d+[^"]*)"[^>]*>([^<]+)<\/a>/gi,
            /<a[^>]*href="([^"]*\/article\/\d+[^"]*)"[^>]*>([^<]+)<\/a>/gi,
            /<a[^>]*href="([^"]*\/[^\/]+\/\d+[^"]*)"[^>]*>([^<]+)<\/a>/gi
        ];
        
        for (const pattern of linkPatterns) {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                const url = match[1];
                const title = match[2].trim().replace(/&amp;/g, '&').replace(/&quot;/g, '"');
                
                if (url && title && title.length > 10) {
                    const fullUrl = url.startsWith('http') ? url : `https://www.hk01.com${url}`;
                    links.push({
                        url: fullUrl,
                        title: title
                    });
                }
            }
        }
        
    } catch (error) {
        console.log(`      提取链接失败: ${error.message}`);
    }
    
    return links;
}

function generateCrawlerWorkflow() {
    console.log('   🔄 三次爬虫完整流程:');
    
    const workflow = [
        {
            step: '第一次爬虫',
            from: '主网址',
            to: '搜索网址',
            action: '获取关键词搜索URL',
            example: 'https://www.hk01.com/search?q=地盤'
        },
        {
            step: '第二次爬虫', 
            from: '搜索网址',
            to: '单一网址',
            action: '从搜索结果提取新闻链接',
            example: 'https://www.hk01.com/社會新聞/60341095/宏福苑聽證會...'
        },
        {
            step: '第三次爬虫',
            from: '单一网址',
            to: '新闻内容',
            action: '提取日期、标题、内容',
            example: '标题: 宏福苑聽證會｜地盤工人稱見起火曾用水喉救火...'
        }
    ];
    
    workflow.forEach(item => {
        console.log(`\n      ${item.step}:`);
        console.log(`         从: ${item.from}`);
        console.log(`         到: ${item.to}`);
        console.log(`         动作: ${item.action}`);
        console.log(`         示例: ${item.example}`);
    });
    
    // 当前问题分析
    console.log('\n   🔍 当前爬虫问题分析:');
    console.log('      问题: 搜索页面返回的链接不是真正的新闻链接');
    console.log('      原因: HK01搜索页面可能使用JavaScript动态加载内容');
    console.log('      解决方案: 需要改进链接提取逻辑或使用其他方法');
}

async function fetchPage(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return fetchPage(res.headers.location).then(resolve).catch(reject);
            }
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('请求超时'));
        });
    });
}

// 运行分析
analyzeSearchStructure().catch(console.error);