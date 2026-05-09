/**
 * 测试特定搜索链接
 */

const axios = require('axios');
const cheerio = require('cheerio');

async function testSpecificSearch() {
    console.log('🔍 测试特定搜索链接...\n');
    
    const searchUrl = 'https://www.hk01.com/search?q=22-04-2026';
    
    try {
        console.log(`📡 测试搜索链接: ${searchUrl}`);
        
        const response = await axios({
            method: 'GET',
            url: searchUrl,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'zh-HK,zh;q=0.9,en;q=0.8'
            },
            timeout: 15000
        });
        
        console.log(`✅ 状态码: ${response.status}`);
        console.log(`📄 内容长度: ${response.data.length} 字符`);
        
        const $ = cheerio.load(response.data);
        
        // 检查页面标题
        const title = $('title').text();
        console.log(`📰 页面标题: ${title}`);
        
        // 检查页面内容
        const bodyText = $('body').text();
        
        // 检查是否有搜索结果相关文本
        if (bodyText.includes('搜尋結果') || bodyText.includes('Search Results')) {
            console.log('🔍 发现搜索结果页面');
        } else {
            console.log('ℹ️ 可能不是搜索结果页面');
        }
        
        // 检查是否有文章链接
        const articleLinks = $('a[href*="/article/"]');
        console.log(`🔗 文章链接数量: ${articleLinks.length}`);
        
        if (articleLinks.length > 0) {
            console.log('🎉 发现文章链接！');
            
            // 显示前10个链接
            articleLinks.slice(0, 10).each((index, element) => {
                const href = $(element).attr('href');
                const text = $(element).text().trim();
                
                if (text && text.length > 0) {
                    console.log(`\n${index + 1}. ${text.substring(0, 100)}`);
                    console.log(`   链接: ${href}`);
                    
                    // 检查是否包含日期信息
                    if (text.includes('22') || text.includes('04') || text.includes('2026')) {
                        console.log(`   📅 包含日期信息`);
                    }
                }
            });
        } else {
            console.log('ℹ️ 没有发现文章链接');
            
            // 显示页面中的其他链接
            const allLinks = $('a');
            console.log(`🔗 总链接数量: ${allLinks.length}`);
            
            // 显示前5个有文本的链接
            allLinks.slice(0, 20).each((index, element) => {
                const href = $(element).attr('href');
                const text = $(element).text().trim();
                
                if (text && text.length > 10 && text.length < 200) {
                    console.log(`\n${index + 1}. ${text.substring(0, 80)}`);
                    console.log(`   链接: ${href}`);
                }
            });
        }
        
        // 检查页面结构
        console.log('\n🏗️ 页面结构分析:');
        
        const selectors = ['article', '.article', '.news-item', '.card', '.list-item', '.result-item'];
        selectors.forEach(selector => {
            const elements = $(selector);
            if (elements.length > 0) {
                console.log(`✅ "${selector}": ${elements.length} 个元素`);
            }
        });
        
        // 检查是否有日期相关信息
        console.log('\n📅 日期相关信息:');
        
        const datePatterns = ['22-04-2026', '22/4/2026', '2026-04-22', '2026年4月22日'];
        datePatterns.forEach(pattern => {
            if (bodyText.includes(pattern)) {
                console.log(`✅ 发现日期模式: ${pattern}`);
            }
        });
        
        // 检查页面中的文本内容
        console.log('\n📝 页面内容摘要:');
        
        // 获取页面中的主要文本段落
        $('p, h1, h2, h3, h4, h5, h6').slice(0, 10).each((index, element) => {
            const text = $(element).text().trim();
            if (text && text.length > 20 && text.length < 500) {
                console.log(`\n${index + 1}. ${text.substring(0, 100)}...`);
            }
        });
        
    } catch (error) {
        console.log(`❌ 测试失败: ${error.message}`);
        if (error.response) {
            console.log(`   状态码: ${error.response.status}`);
        }
    }
}

// 测试其他相关搜索
async function testRelatedSearches() {
    console.log('\n🔍 测试相关搜索...\n');
    
    const relatedSearches = [
        'https://www.hk01.com/search?q=2026-04-22',
        'https://www.hk01.com/search?q=22/4/2026',
        'https://www.hk01.com/search?q=2026年4月22日',
        'https://www.hk01.com/search?q=04-22-2026',
        'https://www.hk01.com/search?q=22-04-2026+新聞',
        'https://www.hk01.com/search?q=2026-04-22+香港'
    ];
    
    for (const url of relatedSearches) {
        try {
            console.log(`📡 测试: ${url}`);
            
            const response = await axios({
                method: 'GET',
                url: url,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 10000
            });
            
            const $ = cheerio.load(response.data);
            const title = $('title').text();
            const articleLinks = $('a[href*="/article/"]').length;
            
            console.log(`   标题: ${title.substring(0, 50)}...`);
            console.log(`   文章链接: ${articleLinks} 个`);
            
            if (articleLinks > 0) {
                console.log('   🎉 发现文章！');
            }
            
            console.log('   ---');
            
        } catch (error) {
            console.log(`   ❌ 失败: ${error.message}`);
            console.log('   ---');
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// 主函数
async function main() {
    console.log('🎯 测试特定搜索链接: https://www.hk01.com/search?q=22-04-2026\n');
    
    await testSpecificSearch();
    await testRelatedSearches();
    
    console.log('\n💡 分析结果:');
    console.log('1. 检查搜索链接是否能返回有效结果');
    console.log('2. 确认搜索结果中是否包含日期相关信息');
    console.log('3. 分析页面结构和内容组织方式');
    console.log('4. 确定最佳的数据提取策略');
}

// 执行测试
if (require.main === module) {
    main().catch(console.error);
}