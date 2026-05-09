/**
 * 刷新爬虫结果脚本
 * 清空已读状态后重新运行爬虫生成新结果
 */

const HK01SmartCrawler = require('./tools/HK01SmartCrawler');
const fs = require('fs');
const path = require('path');

async function refreshCrawlerResults() {
    console.log('🔄 开始刷新爬虫结果...\n');
    
    try {
        // 检查已读文章文件状态
        const seenArticlesPath = path.join(__dirname, 'data', 'seenArticles.json');
        if (fs.existsSync(seenArticlesPath)) {
            const data = JSON.parse(fs.readFileSync(seenArticlesPath, 'utf8'));
            console.log(`📊 当前已读文章数量: ${data.articles.length}`);
            console.log(`📅 最后更新: ${data.lastUpdated}`);
        }
        
        // 初始化爬虫（禁用定时任务）
        const crawler = new HK01SmartCrawler({
            enableScheduler: false,
            dataPath: './data/seenArticles.json'
        });
        
        console.log('\n🔍 开始检查新文章...');
        
        // 运行爬虫检查
        const result = await crawler.manualCheck();
        
        console.log('\n📋 爬虫检查结果:');
        console.log(JSON.stringify({
            success: result.success,
            totalArticles: result.totalArticles,
            uniqueArticles: result.uniqueArticles,
            newArticles: result.newArticles,
            error: result.error || '无错误'
        }, null, 2));
        
        if (result.success && result.newArticles > 0) {
            console.log('\n🎉 成功发现新文章！');
            
            // 显示新文章详情
            result.articles.forEach((article, index) => {
                console.log(`\n📖 文章 ${index + 1}:`);
                console.log(`   标题: ${article.title}`);
                console.log(`   日期: ${new Date(article.publishTime).toLocaleString('zh-HK')}`);
                console.log(`   链接: ${article.publishUrl}`);
                console.log(`   方法: ${article.method}`);
                console.log(`   来源: ${article.source}`);
            });
            
            // 生成新的JSON结果文件
            const outputPath = path.join(__dirname, 'data', 'fresh_crawler_results.json');
            const outputData = {
                metadata: {
                    generatedAt: new Date().toISOString(),
                    crawler: 'HK01SmartCrawler',
                    newArticles: result.newArticles,
                    totalArticles: result.totalArticles
                },
                articles: result.articles
            };
            
            fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
            console.log(`\n💾 新结果已保存到: ${outputPath}`);
            
        } else if (result.success) {
            console.log('\nℹ️ 没有发现新文章');
            
            // 仍然生成结果文件（即使没有新文章）
            const outputPath = path.join(__dirname, 'data', 'fresh_crawler_results.json');
            const outputData = {
                metadata: {
                    generatedAt: new Date().toISOString(),
                    crawler: 'HK01SmartCrawler',
                    newArticles: 0,
                    totalArticles: result.totalArticles,
                    message: '没有发现新文章'
                },
                articles: []
            };
            
            fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
            console.log(`\n💾 空结果已保存到: ${outputPath}`);
        }
        
        // 检查已读文章文件更新状态
        const updatedData = JSON.parse(fs.readFileSync(seenArticlesPath, 'utf8'));
        console.log(`\n📊 更新后已读文章数量: ${updatedData.articles.length}`);
        console.log(`📅 最新更新: ${updatedData.lastUpdated}`);
        
        console.log('\n✅ 爬虫结果刷新完成！');
        
        return result;
        
    } catch (error) {
        console.error('❌ 刷新爬虫结果失败:', error.message);
        console.error(error.stack);
        return { success: false, error: error.message };
    }
}

// 执行刷新
if (require.main === module) {
    refreshCrawlerResults().then(result => {
        if (result.success) {
            console.log('\n🎊 爬虫系统已重置，可以开始新的监控周期！');
        } else {
            console.log('\n⚠️ 爬虫重置失败，请检查系统状态');
        }
    }).catch(console.error);
}

module.exports = { refreshCrawlerResults };