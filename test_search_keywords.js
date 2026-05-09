const https = require('https');

// 测试不同的搜索关键词格式
async function testSearchKeywords() {
    console.log('🔍 测试历史档案API搜索关键词支持...\n');
    
    const testCases = [
        {
            name: "中文关键词（URL编码）",
            url: "https://app.data.gov.hk/v1/historical-archive/list-files?start=20260417&end=20260417&search=%E5%9C%B0%E7%9B%A4"
        },
        {
            name: "英文关键词",
            url: "https://app.data.gov.hk/v1/historical-archive/list-files?start=20260417&end=20260417&search=construction"
        },
        {
            name: "英文关键词（accident）",
            url: "https://app.data.gov.hk/v1/historical-archive/list-files?start=20260417&end=20260417&search=accident"
        },
        {
            name: "英文关键词（safety）",
            url: "https://app.data.gov.hk/v1/historical-archive/list-files?start=20260417&end=20260417&search=safety"
        },
        {
            name: "多个英文关键词",
            url: "https://app.data.gov.hk/v1/historical-archive/list-files?start=20260417&end=20260417&search=construction,accident,safety"
        },
        {
            name: "无搜索关键词（只测试日期）",
            url: "https://app.data.gov.hk/v1/historical-archive/list-files?start=20260417&end=20260417"
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
                result.data.files.slice(0, 2).forEach((file, index) => {
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

// 测试RSS源是否可用
async function testRSSSources() {
    console.log('\n🔍 测试RSS新闻源可用性...\n');
    
    const rssSources = [
        {
            name: '政府新聞處中文RSS',
            url: 'https://www.info.gov.hk/gia/rss/general_zh.xml'
        },
        {
            name: '政府新聞處英文RSS',
            url: 'https://www.info.gov.hk/gia/rss/general_en.xml'
        }
    ];
    
    for (const source of rssSources) {
        console.log(`📰 测试: ${source.name}`);
        
        const result = await new Promise((resolve) => {
            const req = https.get(source.url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        success: res.statusCode === 200,
                        statusCode: res.statusCode,
                        dataLength: data.length
                    });
                });
            });
            
            req.on('error', () => resolve({ success: false }));
            req.setTimeout(5000, () => {
                req.destroy();
                resolve({ success: false, error: '超时' });
            });
        });
        
        if (result.success) {
            console.log(`✅ RSS源可用! 数据长度: ${result.dataLength} 字节`);
            
            // 简单检查是否包含新闻条目
            if (result.dataLength > 1000) {
                console.log(`   📰 包含新闻内容`);
            }
        } else {
            console.log(`❌ RSS源不可用: ${result.statusCode || result.error}`);
        }
        
        console.log('─'.repeat(40));
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

async function main() {
    await testSearchKeywords();
    await testRSSSources();
}

main().catch(console.error);