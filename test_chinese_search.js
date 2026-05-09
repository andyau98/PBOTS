const https = require('https');

// 测试直接使用中文字符搜索
async function testChineseSearch() {
    console.log('🔍 测试历史档案API直接中文字符搜索...\n');
    
    const testCases = [
        {
            name: "直接中文字符（地盤）",
            url: "https://app.data.gov.hk/v1/historical-archive/list-files?start=20260416&end=20260416&search=地盤"
        },
        {
            name: "直接中文字符（安全）",
            url: "https://app.data.gov.hk/v1/historical-archive/list-files?start=20260416&end=20260416&search=安全"
        },
        {
            name: "混合中英文",
            url: "https://app.data.gov.hk/v1/historical-archive/list-files?start=20260416&end=20260416&search=地盤,construction,安全"
        },
        {
            name: "英文关键词（对比）",
            url: "https://app.data.gov.hk/v1/historical-archive/list-files?start=20260416&end=20260416&search=construction"
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`📋 ${testCase.name}`);
        console.log(`🌐 URL: ${testCase.url}`);
        
        const result = await new Promise((resolve) => {
            const req = https.get(testCase.url, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            const jsonData = JSON.parse(data);
                            resolve({
                                success: true,
                                statusCode: res.statusCode,
                                data: jsonData,
                                fileCount: jsonData.files ? jsonData.files.length : 0
                            });
                        } catch (error) {
                            resolve({
                                success: false,
                                statusCode: res.statusCode,
                                error: 'JSON解析失败',
                                rawData: data.substring(0, 500)
                            });
                        }
                    } else {
                        resolve({
                            success: false,
                            statusCode: res.statusCode,
                            error: res.statusMessage,
                            rawData: data
                        });
                    }
                });
            });
            
            req.on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message
                });
            });
            
            req.setTimeout(10000, () => {
                req.destroy();
                resolve({
                    success: false,
                    error: '请求超时'
                });
            });
        });
        
        if (result.success) {
            console.log(`✅ 成功! 状态码: ${result.statusCode}`);
            console.log(`📊 文件数量: ${result.fileCount}`);
            
            if (result.fileCount > 0) {
                console.log(`📄 文件列表示例:`);
                result.data.files.slice(0, 3).forEach((file, index) => {
                    console.log(`   ${index + 1}. ${file.name || file.url}`);
                });
            }
        } else {
            console.log(`❌ 失败: ${result.statusCode || ''} ${result.error}`);
            if (result.rawData) {
                console.log(`📄 错误响应: ${result.rawData.substring(0, 300)}...`);
            }
        }
        
        console.log('─'.repeat(60));
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// 测试RSS新闻源的中文关键词过滤
async function testRSSChineseFilter() {
    console.log('\n🔍 测试RSS新闻源中文关键词过滤...\n');
    
    const rssUrl = 'https://www.info.gov.hk/gia/rss/general_zh.xml';
    
    console.log(`📰 获取RSS数据: ${rssUrl}`);
    
    const rssData = await new Promise((resolve) => {
        const req = https.get(rssUrl, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    success: res.statusCode === 200,
                    statusCode: res.statusCode,
                    data: data
                });
            });
        });
        
        req.on('error', () => resolve({ success: false }));
        req.setTimeout(5000, () => {
            req.destroy();
            resolve({ success: false, error: '超时' });
        });
    });
    
    if (rssData.success) {
        console.log(`✅ RSS源可用! 数据长度: ${rssData.data.length} 字节`);
        
        // 测试中文关键词过滤
        const keywords = ['地盤', '工業意外', '墮下', '夾傷', '不幸離世', '高度關注'];
        
        console.log('\n🔍 测试中文关键词匹配:');
        keywords.forEach(keyword => {
            const count = (rssData.data.match(new RegExp(keyword, 'g')) || []).length;
            console.log(`   "${keyword}": ${count} 次匹配`);
        });
        
        // 提取新闻标题
        const titleMatches = rssData.data.match(/<title[^>]*>([^<]*)<\/title>/gi) || [];
        console.log(`\n📰 新闻标题数量: ${titleMatches.length}`);
        
        // 显示包含关键词的标题
        const relevantTitles = titleMatches.filter(title => 
            keywords.some(keyword => title.includes(keyword))
        );
        
        console.log(`🔍 相关新闻标题: ${relevantTitles.length} 个`);
        relevantTitles.slice(0, 3).forEach((title, index) => {
            const cleanTitle = title.replace(/<[^>]*>/g, '').trim();
            console.log(`   ${index + 1}. ${cleanTitle.substring(0, 60)}...`);
        });
        
    } else {
        console.log(`❌ RSS源不可用: ${rssData.statusCode || rssData.error}`);
    }
}

async function main() {
    await testChineseSearch();
    await testRSSChineseFilter();
}

main().catch(console.error);