/**
 * 运行HK01高级爬虫并显示当日所有新闻结果
 */

const HK01AdvancedCrawler = require('./tools/HK01AdvancedCrawler');

async function runAdvancedCrawler() {
    console.log('🚀 开始运行HK01高级爬虫获取当日所有新闻...\n');
    
    try {
        // 1. 初始化高级爬虫
        console.log('1️⃣ 初始化高级爬虫...');
        const advancedCrawler = new HK01AdvancedCrawler({
            maxArticlesPerPage: 50 // 每页最多50篇文章
        });
        
        // 显示数据库状态
        const stats = advancedCrawler.getDatabaseStats();
        console.log('📊 高级新闻数据库状态:');
        console.log(JSON.stringify(stats, null, 2));
        
        // 2. 开始高级爬取当日所有新闻
        console.log('\n2️⃣ 开始使用高级策略爬取当日所有新闻...');
        const crawlResult = await advancedCrawler.crawlTodayAllNews();
        
        console.log('📋 爬取结果:');
        console.log(JSON.stringify({
            success: crawlResult.success,
            date: crawlResult.date,
            totalArticles: crawlResult.totalArticles,
            newArticles: crawlResult.newArticles,
            error: crawlResult.error || '无错误'
        }, null, 2));
        
        // 3. 显示爬虫结果
        console.log('\n3️⃣ 显示当日所有新闻结果...');
        
        const allArticles = advancedCrawler.newsDatabase.articles;
        console.log(`📊 数据库中共有 ${allArticles.length} 篇文章`);
        
        if (allArticles.length > 0) {
            // 显示分类统计
            const categoryStats = advancedCrawler.getCategoryStats();
            console.log('\n📊 文章分类统计:');
            Object.entries(categoryStats).forEach(([category, count]) => {
                console.log(`   ${category}: ${count} 篇`);
            });
            
            // 显示最新25篇文章
            const recentArticles = allArticles
                .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
                .slice(0, 25);
            
            console.log('\n📰 最新25篇文章:');
            recentArticles.forEach((article, index) => {
                console.log(`\n${index + 1}. ${article.title}`);
                console.log(`   日期: ${article.publishDate}`);
                console.log(`   分类: ${article.category}`);
                console.log(`   策略: ${article.strategy}`);
                console.log(`   链接: ${article.url}`);
                console.log(`   描述: ${article.description?.substring(0, 100)}...`);
            });
            
            // 4. 测试分类搜索
            console.log('\n4️⃣ 测试分类搜索...');
            
            const categories = ['society', 'politics', 'economy', 'entertainment', 'sports', 'technology', 'lifestyle', 'home'];
            
            categories.forEach(category => {
                const categoryArticles = advancedCrawler.searchArticlesByCategory(category, 3);
                console.log(`\n🔍 分类 "${category}": ${categoryArticles.length} 篇文章`);
                
                if (categoryArticles.length > 0) {
                    categoryArticles.forEach((article, index) => {
                        console.log(`   ${index + 1}. ${article.title}`);
                        console.log(`      日期: ${article.publishDate}`);
                        console.log(`      策略: ${article.strategy}`);
                    });
                }
            });
            
            // 5. 测试关键词搜索
            console.log('\n5️⃣ 测试关键词搜索...');
            
            const keywords = ['香港', '新聞', '地盤', '政治', '經濟', '娛樂', '體育', '科技'];
            
            keywords.forEach(keyword => {
                const keywordArticles = advancedCrawler.searchArticles([keyword], 2);
                console.log(`\n🔍 关键词 "${keyword}": ${keywordArticles.length} 篇文章`);
                
                if (keywordArticles.length > 0) {
                    keywordArticles.forEach((article, index) => {
                        console.log(`   ${index + 1}. ${article.title}`);
                        console.log(`      分类: ${article.category}`);
                        console.log(`      日期: ${article.publishDate}`);
                    });
                }
            });
            
        } else {
            console.log('ℹ️ 数据库中没有文章');
        }
        
        console.log('\n✅ HK01高级爬虫运行完成！');
        
        return {
            success: true,
            crawlResult: crawlResult,
            totalArticles: allArticles.length,
            categories: advancedCrawler.getCategoryStats()
        };
        
    } catch (error) {
        console.error('❌ HK01高级爬虫运行失败:', error.message);
        console.error(error.stack);
        return { success: false, error: error.message };
    }
}

// 显示数据库文件信息
function displayDatabaseInfo() {
    console.log('\n💾 高级新闻数据库文件信息:');
    
    try {
        const fs = require('fs');
        const path = require('path');
        
        const dbPath = path.join(__dirname, 'data', 'hk01_advanced_news_database.json');
        
        if (fs.existsSync(dbPath)) {
            const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            console.log(`   文件路径: ${dbPath}`);
            console.log(`   文件大小: ${(fs.statSync(dbPath).size / 1024).toFixed(2)} KB`);
            console.log(`   文章数量: ${dbData.metadata.totalArticles}`);
            console.log(`   日期范围: ${dbData.metadata.dateRange.start} 至 ${dbData.metadata.dateRange.end}`);
            console.log(`   最后更新: ${dbData.metadata.lastUpdated}`);
            
            // 显示分类统计
            const categoryStats = {};
            dbData.articles.forEach(article => {
                categoryStats[article.category] = (categoryStats[article.category] || 0) + 1;
            });
            
            console.log('\n📊 数据库分类统计:');
            Object.entries(categoryStats).forEach(([category, count]) => {
                console.log(`   ${category}: ${count} 篇`);
            });
            
            // 显示策略统计
            const strategyStats = {};
            dbData.articles.forEach(article => {
                strategyStats[article.strategy] = (strategyStats[article.strategy] || 0) + 1;
            });
            
            console.log('\n🎯 数据库策略统计:');
            Object.entries(strategyStats).forEach(([strategy, count]) => {
                console.log(`   ${strategy}: ${count} 篇`);
            });
            
            // 显示文章示例
            if (dbData.articles.length > 0) {
                console.log('\n📰 数据库文章示例:');
                const sampleArticles = dbData.articles.slice(0, 10);
                sampleArticles.forEach((article, index) => {
                    console.log(`\n   ${index + 1}. ${article.title}`);
                    console.log(`      日期: ${article.publishDate}`);
                    console.log(`      分类: ${article.category}`);
                    console.log(`      策略: ${article.strategy}`);
                });
            }
        } else {
            console.log('ℹ️ 高级新闻数据库文件尚未生成');
        }
        
    } catch (error) {
        console.error('❌ 显示数据库信息失败:', error.message);
    }
}

// 主运行流程
async function main() {
    console.log('🎯 HK01高级爬虫运行演示 - 获取当日所有新闻\n');
    
    // 运行爬虫
    const result = await runAdvancedCrawler();
    
    // 显示数据库信息
    displayDatabaseInfo();
    
    console.log('\n📊 运行总结:');
    console.log(`   爬虫运行: ${result.success ? '✅ 成功' : '❌ 失败'}`);
    
    if (result.success) {
        console.log(`   总文章数: ${result.totalArticles} 篇`);
        console.log(`   新文章数: ${result.crawlResult.newArticles} 篇`);
        
        console.log('\n🎉 HK01高级爬虫系统运行正常！');
        console.log('💡 系统特性:');
        console.log('   • 使用高级页面结构分析技术');
        console.log('   • 多种提取策略确保成功率');
        console.log('   • 支持多种新闻分类（社会、政治、经济、娱乐等）');
        console.log('   • 智能关键词提取和分类');
        console.log('   • 完整的数据库存储和查询功能');
        
        console.log('\n💡 下一步行动:');
        console.log('   1. 修改!news命令支持所有新闻类型');
        console.log('   2. 测试分类新闻搜索功能');
        console.log('   3. 配置实时监控所有新闻');
        
        console.log('\n📱 当前系统已支持:');
        console.log('   • 获取当日所有新闻（不只是地盘相关）');
        console.log('   • 按分类搜索新闻（社会、政治、经济、娱乐等）');
        console.log('   • 按关键词搜索新闻');
        console.log('   • 完整的新闻数据库存储');
        console.log('   • 高级页面结构分析技术');
    }
}

// 执行运行
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { runAdvancedCrawler };