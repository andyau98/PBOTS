/**
 * 运行HK01基于日期的爬虫
 * 使用日期直接作为分类来组织新闻
 */

const HK01DateBasedCrawler = require('./tools/HK01DateBasedCrawler');

async function runDateBasedCrawler() {
    console.log('🚀 开始运行HK01基于日期的爬虫...\n');
    
    try {
        // 1. 初始化基于日期的爬虫
        console.log('1️⃣ 初始化基于日期的爬虫...');
        const dateCrawler = new HK01DateBasedCrawler({
            targetDate: '22/4/2026', // 使用22/4/2026作为目标日期
            maxArticlesPerDate: 100 // 每个日期最多100篇文章
        });
        
        // 显示数据库状态
        const stats = dateCrawler.getDatabaseStats();
        console.log('📊 基于日期的数据库状态:');
        console.log(JSON.stringify(stats, null, 2));
        
        // 2. 开始爬取指定日期的新闻
        console.log('\n2️⃣ 开始爬取指定日期的新闻...');
        const crawlResult = await dateCrawler.crawlDateNews('22/4/2026');
        
        console.log('📋 爬取结果:');
        console.log(JSON.stringify({
            success: crawlResult.success,
            date: crawlResult.date,
            formattedDate: crawlResult.formattedDate,
            displayDate: crawlResult.displayDate,
            totalArticles: crawlResult.totalArticles,
            newArticles: crawlResult.newArticles,
            typeStats: crawlResult.typeStats,
            error: crawlResult.error || '无错误'
        }, null, 2));
        
        // 3. 显示爬虫结果
        console.log('\n3️⃣ 显示基于日期的新闻结果...');
        
        const allArticles = dateCrawler.newsDatabase.articles;
        console.log(`📊 数据库中共有 ${allArticles.length} 篇文章`);
        
        if (allArticles.length > 0) {
            // 显示日期分类统计
            const dateStats = dateCrawler.newsDatabase.dateCategories;
            console.log('\n📅 日期分类统计:');
            Object.entries(dateStats).forEach(([date, data]) => {
                console.log(`   ${date}: ${data.count} 篇文章`);
            });
            
            // 显示文章类型统计
            const typeStats = dateCrawler.getArticleTypeStats(allArticles);
            console.log('\n📊 文章类型统计:');
            Object.entries(typeStats).forEach(([type, count]) => {
                console.log(`   ${type}: ${count} 篇`);
            });
            
            // 显示所有日期列表
            const allDates = dateCrawler.getAllDates();
            console.log(`\n📅 数据库中的日期列表: ${allDates.join(', ')}`);
            
            // 显示指定日期的新闻
            const dateArticles = dateCrawler.searchArticlesByDate('22/4/2026', 20);
            console.log(`\n📰 ${dateCrawler.formatDateForDisplay('22/4/2026')} 的新闻 (${dateArticles.length} 篇):`);
            
            dateArticles.forEach((article, index) => {
                console.log(`\n${index + 1}. ${article.title}`);
                console.log(`   日期: ${article.publishDate}`);
                console.log(`   分类: ${article.category}`);
                console.log(`   类型: ${article.articleType}`);
                console.log(`   链接: ${article.url}`);
                console.log(`   策略: ${article.strategy}`);
            });
            
            // 4. 测试按日期搜索
            console.log('\n4️⃣ 测试按日期搜索...');
            
            const testDates = ['22/4/2026'];
            
            testDates.forEach(date => {
                const articles = dateCrawler.searchArticlesByDate(date, 5);
                console.log(`\n🔍 日期 "${date}": ${articles.length} 篇文章`);
                
                if (articles.length > 0) {
                    articles.forEach((article, index) => {
                        console.log(`   ${index + 1}. ${article.title}`);
                        console.log(`      类型: ${article.articleType}`);
                    });
                }
            });
            
            // 5. 测试按文章类型搜索
            console.log('\n5️⃣ 测试按文章类型搜索...');
            
            const articleTypes = Object.keys(typeStats).slice(0, 5);
            
            articleTypes.forEach(type => {
                const typeArticles = dateCrawler.searchArticlesByType(type, 3);
                console.log(`\n🔍 类型 "${type}": ${typeArticles.length} 篇文章`);
                
                if (typeArticles.length > 0) {
                    typeArticles.forEach((article, index) => {
                        console.log(`   ${index + 1}. ${article.title}`);
                        console.log(`      日期: ${article.publishDate}`);
                    });
                }
            });
            
            // 6. 测试日期范围搜索
            console.log('\n6️⃣ 测试日期范围搜索...');
            
            const rangeArticles = dateCrawler.getNewsByDateRange('20/4/2026', '22/4/2026', 5);
            console.log(`🔍 日期范围 20/4/2026 - 22/4/2026: ${rangeArticles.length} 篇文章`);
            
            if (rangeArticles.length > 0) {
                rangeArticles.forEach((article, index) => {
                    console.log(`   ${index + 1}. ${article.title}`);
                    console.log(`      日期: ${article.publishDate}`);
                    console.log(`      类型: ${article.articleType}`);
                });
            }
            
        } else {
            console.log('ℹ️ 数据库中没有文章');
        }
        
        console.log('\n✅ HK01基于日期的爬虫运行完成！');
        
        return {
            success: true,
            crawlResult: crawlResult,
            totalArticles: allArticles.length,
            dates: dateCrawler.getAllDates(),
            typeStats: dateCrawler.getArticleTypeStats(allArticles)
        };
        
    } catch (error) {
        console.error('❌ HK01基于日期的爬虫运行失败:', error.message);
        console.error(error.stack);
        return { success: false, error: error.message };
    }
}

// 显示数据库文件信息
function displayDatabaseInfo() {
    console.log('\n💾 基于日期的数据库文件信息:');
    
    try {
        const fs = require('fs');
        const path = require('path');
        
        const dbPath = path.join(__dirname, 'data', 'hk01_date_based_database.json');
        
        if (fs.existsSync(dbPath)) {
            const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            console.log(`   文件路径: ${dbPath}`);
            console.log(`   文件大小: ${(fs.statSync(dbPath).size / 1024).toFixed(2)} KB`);
            console.log(`   文章数量: ${dbData.metadata.totalArticles}`);
            console.log(`   日期范围: ${dbData.metadata.dateRange.start} 至 ${dbData.metadata.dateRange.end}`);
            console.log(`   最后更新: ${dbData.metadata.lastUpdated}`);
            
            // 显示日期分类统计
            console.log('\n📅 数据库日期分类统计:');
            Object.entries(dbData.dateCategories || {}).forEach(([date, data]) => {
                console.log(`   ${date}: ${data.count} 篇文章`);
            });
            
            // 显示文章类型统计
            const typeStats = {};
            dbData.articles.forEach(article => {
                typeStats[article.articleType] = (typeStats[article.articleType] || 0) + 1;
            });
            
            console.log('\n📊 数据库文章类型统计:');
            Object.entries(typeStats).forEach(([type, count]) => {
                console.log(`   ${type}: ${count} 篇`);
            });
            
            // 显示文章示例
            if (dbData.articles.length > 0) {
                console.log('\n📰 数据库文章示例:');
                const sampleArticles = dbData.articles.slice(0, 10);
                sampleArticles.forEach((article, index) => {
                    console.log(`\n   ${index + 1}. ${article.title}`);
                    console.log(`      日期: ${article.publishDate}`);
                    console.log(`      分类: ${article.category}`);
                    console.log(`      类型: ${article.articleType}`);
                });
            }
        } else {
            console.log('ℹ️ 基于日期的数据库文件尚未生成');
        }
        
    } catch (error) {
        console.error('❌ 显示数据库信息失败:', error.message);
    }
}

// 主运行流程
async function main() {
    console.log('🎯 HK01基于日期的爬虫运行演示 - 使用日期作为分类\n');
    
    // 运行爬虫
    const result = await runDateBasedCrawler();
    
    // 显示数据库信息
    displayDatabaseInfo();
    
    console.log('\n📊 运行总结:');
    console.log(`   爬虫运行: ${result.success ? '✅ 成功' : '❌ 失败'}`);
    
    if (result.success) {
        console.log(`   总文章数: ${result.totalArticles} 篇`);
        console.log(`   新文章数: ${result.crawlResult.newArticles} 篇`);
        console.log(`   日期数量: ${result.dates.length} 个`);
        console.log(`   文章类型: ${Object.keys(result.typeStats).length} 种`);
        
        console.log('\n🎉 HK01基于日期的爬虫系统运行正常！');
        console.log('💡 系统特性:');
        console.log('   • 使用日期直接作为新闻分类');
        console.log('   • 支持多种日期格式（22/4/2026、2026-04-22等）');
        console.log('   • 智能文章类型检测');
        console.log('   • 按日期、类型、日期范围搜索');
        console.log('   • 完整的日期分类统计');
        
        console.log('\n💡 下一步行动:');
        console.log('   1. 测试更多日期的新闻爬取');
        console.log('   2. 修改!news命令支持日期搜索');
        console.log('   3. 配置多日期自动爬取');
        
        console.log('\n📱 当前系统已支持:');
        console.log('   • 按日期分类组织新闻（22/4/2026等）');
        console.log('   • 智能文章类型识别（社会、政治、经济等）');
        console.log('   • 日期范围搜索功能');
        console.log('   • 完整的日期分类数据库');
    }
}

// 执行运行
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { runDateBasedCrawler };