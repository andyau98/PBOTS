/**
 * 测试HK01网站访问和基本内容提取
 */

const axios = require('axios');
const cheerio = require('cheerio');

async function testHK01Access() {
    console.log('🔍 测试HK01网站访问...\n');
    
    const testUrls = [
        'https://www.hk01.com/',
        'https://www.hk01.com/society',
        'https://www.hk01.com/search?q=香港',
        'https://www.hk01.com/channel/2/社會新聞'
    ];
    
    for (const url of testUrls) {
        try {
            console.log(`📡 测试访问: ${url}`);
            
            const response = await axios({
                method: 'GET',
                url: url,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'zh-HK,zh;q=0.9,en;q=0.8'
                },
                timeout: 10000
            });
            
            console.log(`✅ 状态码: ${response.status}`);
            console.log(`📄 内容长度: ${response.data.length} 字符`);
            
            // 分析页面内容
            const $ = cheerio.load(response.data);
            
            // 检查标题
            const title = $('title').text();
            console.log(`📰 页面标题: ${title}`);
            
            // 检查是否有文章相关元素
            const articleElements = $('article, .article, .news-item, .card').length;
            console.log(`📰 文章元素数量: ${articleElements}`);
            
            // 检查链接数量
            const links = $('a').length;
            console.log(`🔗 链接数量: ${links}`);
            
            // 显示前5个链接
            $('a').slice(0, 5).each((index, element) => {
                const href = $(element).attr('href');
                const text = $(element).text().trim().substring(0, 50);
                if (href && href.includes('hk01')) {
                    console.log(`   ${index + 1}. ${text} -> ${href}`);
                }
            });
            
            console.log('---');
            
        } catch (error) {
            console.log(`❌ 访问失败: ${error.message}`);
            if (error.response) {
                console.log(`   状态码: ${error.response.status}`);
            }
            console.log('---');
        }
        
        // 延迟一下
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n📊 测试完成');
}

// 测试页面内容解析
async function testContentParsing() {
    console.log('\n🔍 测试页面内容解析...\n');
    
    try {
        const response = await axios({
            method: 'GET',
            url: 'https://www.hk01.com/',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(response.data);
        
        // 尝试不同的选择器
        const selectors = [
            'article',
            '.article',
            '.news-item',
            '.card',
            '.story',
            '.post',
            '.entry',
            '.content-item',
            '.headline',
            '.featured',
            '.top-story'
        ];
        
        selectors.forEach(selector => {
            const elements = $(selector);
            if (elements.length > 0) {
                console.log(`✅ 选择器 "${selector}": 找到 ${elements.length} 个元素`);
                
                // 显示第一个元素的内容
                const firstElement = elements.first();
                const title = firstElement.find('h1, h2, h3, .title, .headline').text().trim();
                if (title) {
                    console.log(`   示例标题: ${title.substring(0, 100)}`);
                }
            } else {
                console.log(`❌ 选择器 "${selector}": 没有找到元素`);
            }
        });
        
    } catch (error) {
        console.log(`❌ 解析测试失败: ${error.message}`);
    }
}

// 主函数
async function main() {
    console.log('🎯 HK01网站访问测试\n');
    
    await testHK01Access();
    await testContentParsing();
    
    console.log('\n💡 建议:');
    console.log('1. 检查网站是否可正常访问');
    console.log('2. 确认页面结构是否发生变化');
    console.log('3. 可能需要调整选择器或解析策略');
    console.log('4. 考虑使用模拟浏览器或API方式');
}

// 执行测试
if (require.main === module) {
    main().catch(console.error);
}