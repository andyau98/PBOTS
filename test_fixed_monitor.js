// 测试修复后的监控模块
const HKAccidentMonitor = require('./tools/hkAccidentMonitor');

async function testFixedMonitor() {
    console.log('🔍 测试修复后的监控模块...\n');
    
    const monitor = new HKAccidentMonitor();
    
    console.log('📅 测试日期函数:');
    console.log(`   今天日期: ${monitor.getTodayDate()}`);
    console.log(`   昨天日期: ${monitor.getYesterdayDate()}`);
    console.log(`   2天前日期: ${monitor.getDateDaysAgo(2)}`);
    console.log(`   3天前日期: ${monitor.getDateDaysAgo(3)}`);
    
    console.log('\n📰 测试RSS新闻源:');
    try {
        const rssNews = await monitor.fetchRSSNews();
        console.log(`   ✅ RSS新闻获取成功: ${rssNews.length} 条新闻`);
        
        if (rssNews.length > 0) {
            console.log('   📄 新闻示例:');
            rssNews.slice(0, 2).forEach((news, index) => {
                console.log(`      ${index + 1}. ${news.title.substring(0, 50)}...`);
            });
        }
    } catch (error) {
        console.log(`   ❌ RSS新闻获取失败: ${error.message}`);
    }
    
    console.log('\n🌐 测试历史档案API（修复后）:');
    try {
        const historicalNews = await monitor.fetchHistoricalArchiveNews();
        console.log(`   ✅ 历史档案API调用成功: ${historicalNews.length} 条数据`);
        
        if (historicalNews.length > 0) {
            console.log('   📄 数据示例:');
            historicalNews.slice(0, 2).forEach((data, index) => {
                console.log(`      ${index + 1}. ${data.title}`);
            });
        }
    } catch (error) {
        console.log(`   ❌ 历史档案API调用失败: ${error.message}`);
    }
    
    console.log('\n🚧 测试完整监控报告:');
    try {
        const report = await monitor.getRealTimeMonitorReport();
        console.log(`   ✅ 监控报告生成成功: ${report.success}`);
        console.log(`   📊 报告包含新闻数量: ${report.newsCount}`);
        console.log(`   📝 报告长度: ${report.report.length} 字符`);
        
        // 显示报告前200字符
        console.log('\n   📋 报告预览:');
        console.log(report.report.substring(0, 300) + '...');
        
    } catch (error) {
        console.log(`   ❌ 监控报告生成失败: ${error.message}`);
    }
}

// 运行测试
testFixedMonitor().catch(console.error);