// 调试监控模块的数据获取问题
const HKAccidentMonitor = require('./tools/hkAccidentMonitor');

async function debugMonitor() {
    console.log('🔍 调试监控模块数据获取问题...\n');
    
    const monitor = new HKAccidentMonitor();
    
    console.log('📅 当前日期信息:');
    console.log(`   今天: ${monitor.getTodayDate()}`);
    console.log(`   昨天: ${monitor.getYesterdayDate()}`);
    console.log(`   6个月前: ${monitor.getDateMonthsAgo(6)}`);
    
    console.log('\n🔍 测试RSS新闻源详细内容:');
    try {
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
            console.log(`\n📰 测试: ${source.name}`);
            
            const https = require('https');
            const rssData = await new Promise((resolve) => {
                const req = https.get(source.url, (res) => {
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
                req.setTimeout(5000, () => resolve({ success: false, error: '超时' }));
            });
            
            if (rssData.success) {
                console.log(`   ✅ RSS源可用! 数据长度: ${rssData.data.length} 字节`);
                
                // 提取所有标题
                const titleMatches = rssData.data.match(/<title[^>]*>([^<]*)<\/title>/gi) || [];
                console.log(`   📰 新闻标题数量: ${titleMatches.length}`);
                
                // 显示前5个标题
                titleMatches.slice(0, 5).forEach((title, index) => {
                    const cleanTitle = title.replace(/<[^>]*>/g, '').trim();
                    console.log(`      ${index + 1}. ${cleanTitle}`);
                });
                
                // 检查关键词匹配
                const keywords = monitor.keywords;
                console.log(`\n   🔍 关键词匹配检查:`);
                keywords.forEach(keyword => {
                    const count = (rssData.data.match(new RegExp(keyword, 'gi')) || []).length;
                    if (count > 0) {
                        console.log(`      "${keyword}": ${count} 次匹配`);
                    }
                });
                
            } else {
                console.log(`   ❌ RSS源不可用: ${rssData.statusCode || rssData.error}`);
            }
        }
    } catch (error) {
        console.log(`   ❌ RSS测试失败: ${error.message}`);
    }
    
    console.log('\n🔍 测试历史档案API详细结果:');
    try {
        const sixMonthsAgo = monitor.getDateMonthsAgo(6);
        const yesterday = monitor.getYesterdayDate();
        
        const url = `https://app.data.gov.hk/v1/historical-archive/list-files?start=${sixMonthsAgo}&end=${yesterday}&search=地盤`;
        console.log(`   🌐 API URL: ${url}`);
        
        const response = await monitor.makeAPIRequest(url);
        const data = JSON.parse(response.data);
        
        console.log(`   ✅ API响应成功!`);
        console.log(`   📊 文件总数: ${data.files ? data.files.length : 0}`);
        
        if (data.files && data.files.length > 0) {
            console.log(`   📄 文件列表:`);
            data.files.slice(0, 5).forEach((file, index) => {
                console.log(`      ${index + 1}. ${file.name || file.url}`);
                console.log(`         格式: ${file.format}, 大小: ${file.size || '未知'}`);
            });
        } else {
            console.log(`   ❌ 没有找到相关文件`);
        }
        
    } catch (error) {
        console.log(`   ❌ API测试失败: ${error.message}`);
    }
    
    console.log('\n🔍 测试备用数据源:');
    try {
        const fallbackData = await monitor.fallbackToAlternativeSources();
        console.log(`   📊 备用数据源新闻数量: ${fallbackData.length}`);
        
        if (fallbackData.length > 0) {
            console.log(`   📄 备用新闻示例:`);
            fallbackData.slice(0, 3).forEach((news, index) => {
                console.log(`      ${index + 1}. ${news.title}`);
                console.log(`         来源: ${news.source}, 部门: ${news.department}`);
            });
        }
        
    } catch (error) {
        console.log(`   ❌ 备用数据源测试失败: ${error.message}`);
    }
}

// 运行调试
debugMonitor().catch(console.error);