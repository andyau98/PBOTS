/**
 * 运行HK01爬虫并显示结果
 */

const HK01HistoricalCrawler = require('./tools/HK01HistoricalCrawler');
const HK01DailyCrawler = require('./tools/HK01DailyCrawler');

async function runHK01Crawler() {
    console.log('🚀 开始运行HK01爬虫...\n');
    
    try {
        // 1. 初始化历史数据爬虫
        console.log('1️⃣ 初始化历史数据爬虫...');
        const historicalCrawler = new HK01HistoricalCrawler({
            startDate: '2026-04-15', // 从4月15日开始测试
            endDate: new Date().toISOString().split('T')[0]
        });
        
        // 显示数据库状态
        const stats = historicalCrawler.getDatabaseStats();
        console.log('📊 数据库状态:');
        console.log(JSON.stringify(stats, null, 2));
        
        // 2. 开始历史数据爬取
        console.log('\n2️⃣ 开始历史数据爬取...');
        const historicalResult = await historicalCrawler.startHistoricalCrawl();
        
        console.log('📋 历史数据爬取结果:');
        console.log(JSON.stringify(historicalResult, null, 2));
        
        // 3. 初始化每日爬虫
        console.log('\n3️⃣ 初始化每日爬虫...');
        const dailyCrawler = new HK01DailyCrawler({
            enableScheduler: false // 测试时禁用定时任务
        });
        
        // 显示爬虫状态
        const dailyStatus = dailyCrawler.getStatus();
        console.log('📊 每日爬虫状态:');
        console.log(JSON.stringify(dailyStatus, null, 2));
        
        // 4. 运行实时爬取
        console.log('\n4️⃣ 运行实时爬取...');
        const realtimeResult = await dailyCrawler.manualCrawl();
        
        console.log('📋 实时爬取结果:');
        console.log(JSON.stringify({
            success: realtimeResult.success,
            newArticles: realtimeResult.newArticles,
            totalArticles: realtimeResult.totalArticles,
            error: realtimeResult.error || '无错误'
        }, null, 2));
        
        // 5. 显示爬虫结果
        console.log('\n5️⃣ 显示爬虫结果...');
        
        // 获取数据库中的文章
        const allArticles = dailyCrawler.newsDatabase.articles;
        console.log(`📊 数据库中共有 ${allArticles.length} 篇文章`);
        
        if (allArticles.length > 0) {
            // 显示最新5篇文章
            const recentArticles = allArticles
                .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
                .slice(0, 5);
            
            console.log('\n📰 最新5篇文章:');
            recentArticles.forEach((article, index) => {
                console.log(`\n${index + 1}. ${article.title}`);
                console.log(`   日期: ${article.publishDate}`);
                console.log(`   分类: ${article.category}`);
                console.log(`   关键词: ${article.keywords?.join(', ')}`);
                console.log(`   链接: ${article.url}`);
                console.log(`   描述: ${article.description?.substring(0, 100)}...`);
            });
            
            // 显示分类统计
            const categoryStats = dailyCrawler.getCategoryStats();
            console.log('\n📊 文章分类统计:');
            Object.entries(categoryStats).forEach(([category, count]) => {
                console.log(`   ${category}: ${count} 篇`);
            });
        } else {
            console.log('ℹ️ 数据库中没有文章');
        }
        
        // 6. 测试搜索功能
        console.log('\n6️⃣ 测试搜索功能...');
        const searchKeywords = ['地盤', '工傷', '意外', '安全'];
        
        searchKeywords.forEach(keyword => {
            const searchResults = dailyCrawler.searchArticles([keyword], 3);
            console.log(`\n🔍 搜索 "${keyword}": ${searchResults.length} 篇文章`);
            
            if (searchResults.length > 0) {
                searchResults.forEach((article, index) => {
                    console.log(`   ${index + 1}. ${article.title}`);
                });
            }
        });
        
        console.log('\n✅ HK01爬虫运行完成！');
        
        return {
            success: true,
            historicalResult: historicalResult,
            realtimeResult: realtimeResult,
            totalArticles: allArticles.length,
            categories: dailyCrawler.getCategoryStats()
        };
        
    } catch (error) {
        console.error('❌ HK01爬虫运行失败:', error.message);
        console.error(error.stack);
        return { success: false, error: error.message };
    }
}

// 显示数据库文件信息
function displayDatabaseInfo() {
    console.log('\n💾 数据库文件信息:');
    
    try {
        const fs = require('fs');
        const path = require('path');
        
        const dbPath = path.join(__dirname, 'data', 'hk01_news_database.json');
        
        if (fs.existsSync(dbPath)) {
            const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            console.log(`   文件路径: ${dbPath}`);
            console.log(`   文件大小: ${(fs.statSync(dbPath).size / 1024).toFixed(2)} KB`);
            console.log(`   文章数量: ${dbData.metadata.totalArticles}`);
            console.log(`   日期范围: ${dbData.metadata.dateRange.start} 至 ${dbData.metadata.dateRange.end}`);
            console.log(`   最后更新: ${dbData.metadata.lastUpdated}`);
            
            // 显示文章示例
            if (dbData.articles.length > 0) {
                console.log('\n📰 数据库文章示例:');
                const sampleArticles = dbData.articles.slice(0, 3);
                sampleArticles.forEach((article, index) => {
                    console.log(`\n   ${index + 1}. ${article.title}`);
                    console.log(`      日期: ${article.publishDate}`);
                    console.log(`      分类: ${article.category}`);
                    console.log(`      关键词: ${article.keywords?.join(', ')}`);
                });
            }
        } else {
            console.log('ℹ️ 数据库文件尚未生成');
        }
        
    } catch (error) {
        console.error('❌ 显示数据库信息失败:', error.message);
    }
}

// 主运行流程
async function main() {
    console.log('🎯 HK01爬虫运行演示\n');
    
    // 运行爬虫
    const result = await runHK01Crawler();
    
    // 显示数据库信息
    displayDatabaseInfo();
    
    console.log('\n📊 运行总结:');
    console.log(`   爬虫运行: ${result.success ? '✅ 成功' : '❌ 失败'}`);
    
    if (result.success) {
        console.log(`   历史数据: ${result.historicalResult.totalArticles} 篇文章`);
        console.log(`   实时爬取: ${result.realtimeResult.newArticles} 篇新文章`);
        console.log(`   总文章数: ${result.totalArticles} 篇`);
        
        console.log('\n🎉 HK01爬虫系统运行正常！');
        console.log('💡 下一步行动:');
        console.log('   1. 使用!news命令测试新闻报告');
        console.log('   2. 检查WhatsApp Bot集成');
        console.log('   3. 配置定时监控任务');
    }
}

// 执行运行
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { runHK01Crawler };