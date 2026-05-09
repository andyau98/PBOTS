const https = require('https');

// 测试不同的日期范围
async function testDateRanges() {
    console.log('🔍 测试历史档案API日期范围支持...\n');
    
    // 获取当前日期
    const now = new Date();
    const today = now.toISOString().slice(0,10).replace(/-/g, '');
    
    // 获取不同范围的日期
    const getDateDaysAgo = (days) => {
        const date = new Date(now);
        date.setDate(date.getDate() - days);
        return date.toISOString().slice(0,10).replace(/-/g, '');
    };
    
    const getDateMonthsAgo = (months) => {
        const date = new Date(now);
        date.setMonth(date.getMonth() - months);
        return date.toISOString().slice(0,10).replace(/-/g, '');
    };
    
    const testCases = [
        {
            name: "1天范围（昨天到今天）",
            start: getDateDaysAgo(1),
            end: today
        },
        {
            name: "7天范围",
            start: getDateDaysAgo(7),
            end: today
        },
        {
            name: "30天范围",
            start: getDateDaysAgo(30),
            end: today
        },
        {
            name: "3个月范围",
            start: getDateMonthsAgo(3),
            end: today
        },
        {
            name: "6个月范围",
            start: getDateMonthsAgo(6),
            end: today
        },
        {
            name: "1年范围",
            start: getDateMonthsAgo(12),
            end: today
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`📋 ${testCase.name}`);
        console.log(`📅 日期范围: ${testCase.start} 至 ${testCase.end}`);
        
        const url = `https://app.data.gov.hk/v1/historical-archive/list-files?start=${testCase.start}&end=${testCase.end}&search=地盤`;
        console.log(`🌐 URL: ${url.substring(0, 80)}...`);
        
        const result = await new Promise((resolve) => {
            const req = https.get(url, (res) => {
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

// 测试API对历史日期的支持
async function testHistoricalDates() {
    console.log('\n🔍 测试历史日期支持...\n');
    
    const testCases = [
        {
            name: "2024年数据",
            start: "20240101",
            end: "20241231"
        },
        {
            name: "2023年数据",
            start: "20230101",
            end: "20231231"
        },
        {
            name: "2022年数据",
            start: "20220101",
            end: "20221231"
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`📋 ${testCase.name}`);
        console.log(`📅 日期范围: ${testCase.start} 至 ${testCase.end}`);
        
        const url = `https://app.data.gov.hk/v1/historical-archive/list-files?start=${testCase.start}&end=${testCase.end}&search=地盤`;
        console.log(`🌐 URL: ${url.substring(0, 80)}...`);
        
        const result = await new Promise((resolve) => {
            const req = https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            const jsonData = JSON.parse(data);
                            resolve({
                                success: true,
                                statusCode: res.statusCode,
                                fileCount: jsonData.files ? jsonData.files.length : 0
                            });
                        } catch (error) {
                            resolve({
                                success: false,
                                statusCode: res.statusCode,
                                error: 'JSON解析失败'
                            });
                        }
                    } else {
                        resolve({
                            success: false,
                            statusCode: res.statusCode,
                            error: res.statusMessage
                        });
                    }
                });
            });
            
            req.on('error', (error) => resolve({ success: false, error: error.message }));
            req.setTimeout(10000, () => resolve({ success: false, error: '超时' }));
        });
        
        if (result.success) {
            console.log(`✅ 成功! 文件数量: ${result.fileCount}`);
        } else {
            console.log(`❌ 失败: ${result.statusCode || ''} ${result.error}`);
        }
        
        console.log('─'.repeat(40));
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

async function main() {
    await testDateRanges();
    await testHistoricalDates();
}

main().catch(console.error);