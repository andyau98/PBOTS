// 分析HK01单一网址结构
const https = require('https');

// 您提供的成功案例
const successUrl = 'https://www.hk01.com/%E7%A4%BE%E6%9C%83%E6%96%B0%E8%81%9E/60341095/%E5%AE%8F%E7%A6%8F%E8%8B%91%E8%81%BD%E8%AD%89%E6%9C%83-%E5%9C%B0%E7%9B%A4%E5%B7%A5%E4%BA%BA%E7%A8%B1%E8%A6%8B%E8%B5%B7%E7%81%AB%E6%9B%BE%E7%94%A8%E6%B0%B4%E5%96%89%E6%95%91%E7%81%AB-%E4%BD%8620%E8%87%B330%E7%A7%92%E5%BE%8C%E7%84%A1%E6%B0%B4?itm_source=universal_search&itm_campaign=hk01&itm_content=all&itm_medium=web';

async function analyzeUrlStructure() {
    console.log('🔍 分析HK01单一网址结构...\n');
    
    // 分析成功案例的URL结构
    console.log('📋 成功案例URL分析:');
    analyzeSingleUrl(successUrl);
    
    // 生成更多可能的URL模式
    console.log('\n🔧 生成URL识别模式...');
    generateUrlPatterns();
    
    // 测试URL识别
    console.log('\n🧪 测试URL识别...');
    await testUrlRecognition();
}

function analyzeSingleUrl(url) {
    console.log(`   原始URL: ${url}`);
    
    // URL解码
    const decodedUrl = decodeURIComponent(url);
    console.log(`   解码URL: ${decodedUrl}`);
    
    // 分割URL部分
    const urlParts = url.split('/');
    console.log(`   URL部分数量: ${urlParts.length}`);
    
    // 分析每个部分
    console.log('   📊 URL结构分解:');
    urlParts.forEach((part, index) => {
        if (part) {
            const decodedPart = decodeURIComponent(part);
            console.log(`      ${index}. ${part} → ${decodedPart}`);
        }
    });
    
    // 提取关键信息
    console.log('   🔑 关键信息提取:');
    
    // 域名
    console.log(`      域名: ${urlParts[2]}`);
    
    // 分类
    if (urlParts[3]) {
        const category = decodeURIComponent(urlParts[3]);
        console.log(`      分类: ${category}`);
    }
    
    // 文章ID
    if (urlParts[4]) {
        console.log(`      文章ID: ${urlParts[4]}`);
    }
    
    // 标题
    if (urlParts[5]) {
        const title = decodeURIComponent(urlParts[5].split('?')[0]); // 去掉参数
        console.log(`      标题: ${title}`);
    }
    
    // 参数
    if (urlParts[5] && urlParts[5].includes('?')) {
        const params = urlParts[5].split('?')[1];
        console.log(`      参数: ${params}`);
    }
}

function generateUrlPatterns() {
    console.log('   📋 HK01新闻URL模式:');
    
    const patterns = [
        {
            name: '社会新闻',
            pattern: '/社會新聞/\\d+/[^/?]+',
            example: '/社會新聞/60341095/宏福苑聽證會-地盤工人...'
        },
        {
            name: '港闻',
            pattern: '/港聞/\\d+/[^/?]+',
            example: '/港聞/12345678/標題內容'
        },
        {
            name: '英文文章',
            pattern: '/article/\\d+/[^/?]+',
            example: '/article/12345678/title-content'
        },
        {
            name: '其他分类',
            pattern: '/[^/]+/\\d+/[^/?]+',
            example: '/任何分類/12345678/標題內容'
        }
    ];
    
    patterns.forEach(pattern => {
        console.log(`      🔹 ${pattern.name}: ${pattern.pattern}`);
        console.log(`          示例: ${pattern.example}`);
    });
    
    // 生成正则表达式
    console.log('\n   🔧 正则表达式模式:');
    const regexPatterns = [
        '/社會新聞/\\d+/[^/?]+',
        '/港聞/\\d+/[^/?]+',
        '/article/\\d+/[^/?]+',
        '/[^/]+/\\d+/[^/?]+'
    ];
    
    regexPatterns.forEach(pattern => {
        console.log(`      📝 ${pattern}`);
    });
}

async function testUrlRecognition() {
    console.log('   🧪 测试URL识别功能...');
    
    // 测试URL列表
    const testUrls = [
        successUrl,
        'https://www.hk01.com/社會新聞/60341095/宏福苑聽證會-地盤工人稱見起火曾用水喉救火-但20至30秒後無水',
        'https://www.hk01.com/港聞/12345678/香港地盤工業意外-工人高處墮下',
        'https://www.hk01.com/article/98765432/hong-kong-construction-accident-worker-fell',
        'https://www.hk01.com/其他分類/55555555/測試標題內容'
    ];
    
    testUrls.forEach(url => {
        console.log(`\n   🔍 测试URL: ${url}`);
        
        // 检查是否符合HK01新闻URL模式
        const isHK01News = isHK01NewsUrl(url);
        console.log(`      HK01新闻URL: ${isHK01News ? '✅' : '❌'}`);
        
        if (isHK01News) {
            // 提取信息
            const info = extractUrlInfo(url);
            console.log(`      分类: ${info.category}`);
            console.log(`      文章ID: ${info.articleId}`);
            console.log(`      标题: ${info.title}`);
            console.log(`      包含地盤关键词: ${info.containsConstruction ? '✅' : '❌'}`);
        }
    });
}

function isHK01NewsUrl(url) {
    // HK01新闻URL模式
    const patterns = [
        /\/社會新聞\/\d+\/[^\/?]+/,
        /\/港聞\/\d+\/[^\/?]+/,
        /\/article\/\d+\/[^\/?]+/,
        /\/[^\/]+\/\d+\/[^\/?]+/
    ];
    
    return patterns.some(pattern => pattern.test(url));
}

function extractUrlInfo(url) {
    const urlParts = url.split('/');
    
    return {
        category: urlParts[3] ? decodeURIComponent(urlParts[3]) : '未知',
        articleId: urlParts[4] || '未知',
        title: urlParts[5] ? decodeURIComponent(urlParts[5].split('?')[0]) : '未知',
        containsConstruction: url.toLowerCase().includes('地盤')
    };
}

// 运行分析
analyzeUrlStructure().catch(console.error);