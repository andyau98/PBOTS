/**
 * 测试HK01日期搜索功能
 */

const axios = require('axios');

async function testDateSearch() {
    console.log('🔍 测试HK01日期搜索功能...\n');
    
    // 测试不同的日期格式
    const testDates = [
        '2026-04-22', // ISO格式
        '22/4/2026',  // 香港格式
        '22-04-2026', // 另一种格式
        '2026/04/22', // 反斜杠格式
        '22-Apr-2026', // 英文格式
        '20260422'     // 紧凑格式
    ];
    
    for (const date of testDates) {
        try {
            console.log(`📅 测试日期格式: ${date}`);
            
            // 构建搜索URL
            const searchUrl = `https://www.hk01.com/search?date=${encodeURIComponent(date)}`;
            console.log(`🔗 搜索URL: ${searchUrl}`);
            
            const response = await axios({
                method: 'GET',
                url: searchUrl,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 10000
            });
            
            console.log(`✅ 状态码: ${response.status}`);
            console.log(`📄 内容长度: ${response.data.length} 字符`);
            
            // 检查页面标题
            const cheerio = require('cheerio');
            const $ = cheerio.load(response.data);
            const title = $('title').text();
            console.log(`📰 页面标题: ${title}`);
            
            // 检查是否有搜索结果
            const resultText = $('body').text();
            if (resultText.includes('搜尋結果') || resultText.includes('Search Results')) {
                console.log('🔍 发现搜索结果页面');
            } else {
                console.log('ℹ️ 可能不是搜索结果页面');
            }
            
            console.log('---');
            
        } catch (error) {
            console.log(`❌ 测试失败: ${error.message}`);
            if (error.response) {
                console.log(`   状态码: ${error.response.status}`);
            }
            console.log('---');
        }
        
        // 延迟一下
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 测试当前日期
    console.log('\n📅 测试当前日期...');
    
    const today = new Date();
    const todayFormats = [
        today.toISOString().split('T')[0], // 2026-04-22
        today.toLocaleDateString('zh-HK'), // 22/4/2026
        today.toLocaleDateString('en-GB')  // 22/04/2026
    ];
    
    for (const format of todayFormats) {
        try {
            console.log(`📅 测试当前日期格式: ${format}`);
            
            const searchUrl = `https://www.hk01.com/search?date=${encodeURIComponent(format)}`;
            
            const response = await axios({
                method: 'GET',
                url: searchUrl,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 10000
            });
            
            console.log(`✅ 状态码: ${response.status}`);
            
            // 检查是否有内容
            const $ = cheerio.load(response.data);
            const links = $('a[href*="/article/"]').length;
            console.log(`🔗 文章链接数量: ${links}`);
            
            if (links > 0) {
                console.log('🎉 发现文章链接！');
                
                // 显示前3个链接
                $('a[href*="/article/"]').slice(0, 3).each((index, element) => {
                    const href = $(element).attr('href');
                    const text = $(element).text().trim().substring(0, 50);
                    console.log(`   ${index + 1}. ${text} -> ${href}`);
                });
            }
            
            console.log('---');
            
        } catch (error) {
            console.log(`❌ 测试失败: ${error.message}`);
            console.log('---');
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n📊 测试完成');
}

// 测试HK01是否支持日期搜索
async function testDateSearchSupport() {
    console.log('\n🔍 测试HK01日期搜索支持...\n');
    
    // 测试不同的搜索参数
    const testParams = [
        'date=2026-04-22',
        'from=2026-04-22&to=2026-04-22',
        'q=香港+date:2026-04-22',
        'after=2026-04-22',
        'before=2026-04-22'
    ];
    
    for (const param of testParams) {
        try {
            console.log(`🔍 测试参数: ${param}`);
            
            const searchUrl = `https://www.hk01.com/search?${param}`;
            
            const response = await axios({
                method: 'GET',
                url: searchUrl,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 10000
            });
            
            console.log(`✅ 状态码: ${response.status}`);
            
            const $ = cheerio.load(response.data);
            const title = $('title').text();
            
            if (title.includes('搜尋結果') || title.includes('Search Results')) {
                console.log('🔍 成功访问搜索结果页面');
                
                // 检查是否有文章
                const articles = $('article, .article, .news-item').length;
                console.log(`📰 文章元素数量: ${articles}`);
                
                const links = $('a[href*="/article/"]').length;
                console.log(`🔗 文章链接数量: ${links}`);
                
            } else {
                console.log('ℹ️ 不是搜索结果页面');
            }
            
            console.log('---');
            
        } catch (error) {
            console.log(`❌ 测试失败: ${error.message}`);
            console.log('---');
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// 主函数
async function main() {
    console.log('🎯 HK01日期搜索功能测试\n');
    
    await testDateSearch();
    await testDateSearchSupport();
    
    console.log('\n💡 分析结果:');
    console.log('1. 检查HK01是否真正支持按日期搜索');
    console.log('2. 确认正确的日期参数格式');
    console.log('3. 可能需要使用其他搜索策略');
    console.log('4. 考虑使用内容分析而非日期搜索');
}

// 执行测试
if (require.main === module) {
    main().catch(console.error);
}