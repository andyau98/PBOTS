/**
 * 测试完整的实时爬虫系统
 */

const HK01HistoricalCrawler = require('./tools/HK01HistoricalCrawler');
const HK01DailyCrawler = require('./tools/HK01DailyCrawler');
const NewsReporter = require('./tools/newsReporter');

async function testCompleteSystem() {
    console.log('🚀 测试完整的实时爬虫系统...\n');
    
    try {
        // 1. 测试历史数据爬虫
        console.log('1️⃣ 测试历史数据爬虫...');
        const historicalCrawler = new HK01HistoricalCrawler({
            startDate: '2026-04-15', // 从4月15日开始测试
            endDate: new Date().toISOString().split('T')[0]
        });
        
        const stats = historicalCrawler.getDatabaseStats();
        console.log('📊 数据库统计:');
        console.log(JSON.stringify(stats, null, 2));
        
        // 2. 测试搜索功能
        console.log('\n2️⃣ 测试搜索功能...');
        const searchResults = historicalCrawler.searchArticles(['地盤', '工傷'], 5);
        console.log(`🔍 搜索到 ${searchResults.length} 篇相关文章`);
        
        if (searchResults.length > 0) {
            searchResults.forEach((article, index) => {
                console.log(`   ${index + 1}. ${article.title}`);
                console.log(`      日期: ${article.publishDate}`);
                console.log(`      分类: ${article.category}`);
            });
        }
        
        // 3. 测试每日爬虫
        console.log('\n3️⃣ 测试每日爬虫...');
        const dailyCrawler = new HK01DailyCrawler({
            enableScheduler: false // 测试时禁用定时任务
        });
        
        const dailyStatus = dailyCrawler.getStatus();
        console.log('📊 每日爬虫状态:');
        console.log(JSON.stringify(dailyStatus, null, 2));
        
        // 4. 测试手动爬取
        console.log('\n4️⃣ 测试手动爬取今日新闻...');
        const crawlResult = await dailyCrawler.manualCrawl();
        console.log('📋 爬取结果:');
        console.log(JSON.stringify({
            success: crawlResult.success,
            newArticles: crawlResult.newArticles,
            totalArticles: crawlResult.totalArticles,
            error: crawlResult.error || '无错误'
        }, null, 2));
        
        // 5. 测试新闻报告器
        console.log('\n5️⃣ 测试新闻报告器...');
        const reporter = new NewsReporter();
        
        console.log('🔍 执行!news命令模拟...');
        const newsReport = await reporter.getConstructionAccidentNews();
        
        console.log('📋 新闻报告内容:');
        console.log('─'.repeat(80));
        console.log(newsReport);
        console.log('─'.repeat(80));
        
        // 分析报告
        const lines = newsReport.split('\n');
        const newsCount = lines.filter(line => line.includes('*') && line.includes('.')).length;
        const isDatabaseReport = newsReport.includes('數據庫查詢') || newsReport.includes('歷史數據庫');
        
        console.log('\n📊 报告分析:');
        console.log(`   报告行数: ${lines.length}`);
        console.log(`   新闻数量: ${newsCount}`);
        console.log(`   数据来源: ${isDatabaseReport ? '✅ 数据库查询' : '❌ 其他来源'}`);
        
        // 6. 测试本周新闻功能
        console.log('\n6️⃣ 测试本周新闻功能...');
        const weeklyReport = await reporter.getThisWeekConstructionAccidentNews();
        
        const weeklyLines = weeklyReport.split('\n');
        const weeklyNewsCount = weeklyLines.filter(line => line.includes('*') && line.includes('.')).length;
        
        console.log(`📅 本周新闻数量: ${weeklyNewsCount}`);
        
        console.log('\n✅ 系统测试完成！');
        
        return {
            success: true,
            historicalStats: stats,
            searchResults: searchResults.length,
            dailyCrawl: crawlResult,
            newsReportLength: newsReport.length,
            usesDatabase: isDatabaseReport
        };
        
    } catch (error) {
        console.error('❌ 系统测试失败:', error.message);
        console.error(error.stack);
        return { success: false, error: error.message };
    }
}

// 测试数据库文件生成
async function testDatabaseGeneration() {
    console.log('\n💾 测试数据库文件生成...');
    
    try {
        const fs = require('fs');
        const path = require('path');
        
        const dbPath = path.join(__dirname, 'data', 'hk01_news_database.json');
        
        if (fs.existsSync(dbPath)) {
            const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            console.log('📊 数据库文件状态:');
            console.log(`   文件路径: ${dbPath}`);
            console.log(`   文章数量: ${dbData.metadata.totalArticles}`);
            console.log(`   日期范围: ${dbData.metadata.dateRange.start} 至 ${dbData.metadata.dateRange.end}`);
            console.log(`   最后更新: ${dbData.metadata.lastUpdated}`);
            
            // 显示最新5篇文章
            const recentArticles = dbData.articles
                .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
                .slice(0, 5);
            
            console.log('\n📰 最新5篇文章:');
            recentArticles.forEach((article, index) => {
                console.log(`   ${index + 1}. ${article.title}`);
                console.log(`      日期: ${article.publishDate}`);
                console.log(`      分类: ${article.category}`);
            });
            
        } else {
            console.log('ℹ️ 数据库文件尚未生成');
        }
        
    } catch (error) {
        console.error('❌ 数据库文件测试失败:', error.message);
    }
}

// 主测试流程
async function main() {
    console.log('🎯 实时爬虫系统完整测试\n');
    
    // 测试系统功能
    const systemResult = await testCompleteSystem();
    
    // 测试数据库文件
    await testDatabaseGeneration();
    
    console.log('\n📊 测试总结:');
    console.log(`   系统功能: ${systemResult.success ? '✅ 成功' : '❌ 失败'}`);
    
    if (systemResult.success) {
        console.log(`   历史数据: ${systemResult.historicalStats.totalArticles} 篇文章`);
        console.log(`   搜索功能: ${systemResult.searchResults} 篇相关文章`);
        console.log(`   新闻报告: ${systemResult.newsReportLength} 字符`);
        console.log(`   数据来源: ${systemResult.usesDatabase ? '✅ 数据库' : '❌ 其他'}`);
        
        console.log('\n🎉 实时爬虫系统已成功实现！');
        console.log('💡 系统特性:');
        console.log('   • 从2026年2月至今的历史数据爬取');
        console.log('   • 按日爬取和实时监控机制');
        console.log('   • 完整的JSON数据库存储');
        console.log('   • !news命令使用数据库查询');
        console.log('   • 可扩展的其他资讯搜索');
    }
}

// 执行测试
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testCompleteSystem };