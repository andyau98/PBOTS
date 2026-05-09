/**
 * 测试!news命令是否使用新的爬虫JSON数据
 */

const NewsReporter = require('./tools/newsReporter');
const fs = require('fs');
const path = require('path');

async function testNewsCommand() {
    console.log('🧪 测试!news命令数据源...\n');
    
    try {
        // 检查当前seenArticles.json状态
        const seenArticlesPath = path.join(__dirname, 'data', 'seenArticles.json');
        if (fs.existsSync(seenArticlesPath)) {
            const seenData = JSON.parse(fs.readFileSync(seenArticlesPath, 'utf8'));
            console.log('📊 当前已读文章状态:');
            console.log(`   已读文章数量: ${seenData.articles.length}`);
            console.log(`   最后更新: ${seenData.lastUpdated}`);
            console.log('');
        }
        
        // 初始化新闻报告器
        const reporter = new NewsReporter();
        
        console.log('🔍 执行!news命令...\n');
        
        // 模拟!news命令执行
        const newsReport = await reporter.getConstructionAccidentNews();
        
        console.log('📋 新闻报告内容:');
        console.log('─'.repeat(80));
        console.log(newsReport);
        console.log('─'.repeat(80));
        
        // 分析报告内容
        const lines = newsReport.split('\n');
        const newsCount = lines.filter(line => line.includes('*')).length;
        const isRealData = newsReport.includes('HK01 智能爬蟲') || newsReport.includes('基於搜索發現');
        
        console.log('\n📊 报告分析:');
        console.log(`   报告行数: ${lines.length}`);
        console.log(`   新闻数量: ${newsCount}`);
        console.log(`   数据来源: ${isRealData ? '✅ 真实爬虫数据' : '❌ 模拟数据'}`);
        console.log(`   报告长度: ${newsReport.length} 字符`);
        
        // 检查seenArticles.json是否更新
        const updatedData = JSON.parse(fs.readFileSync(seenArticlesPath, 'utf8'));
        console.log('\n📊 更新后已读文章状态:');
        console.log(`   已读文章数量: ${updatedData.articles.length}`);
        console.log(`   最新更新: ${updatedData.lastUpdated}`);
        
        // 检查fresh_crawler_results.json是否存在
        const freshResultsPath = path.join(__dirname, 'data', 'fresh_crawler_results.json');
        if (fs.existsSync(freshResultsPath)) {
            const freshData = JSON.parse(fs.readFileSync(freshResultsPath, 'utf8'));
            console.log('\n📊 最新爬虫结果:');
            console.log(`   生成时间: ${freshData.metadata.generatedAt}`);
            console.log(`   新文章数量: ${freshData.metadata.newArticles}`);
            console.log(`   总文章数量: ${freshData.metadata.totalArticles}`);
        }
        
        console.log('\n✅ 测试完成！');
        
        return {
            success: true,
            usesRealData: isRealData,
            newsCount: newsCount,
            reportLength: newsReport.length
        };
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        return { success: false, error: error.message };
    }
}

// 执行测试
if (require.main === module) {
    testNewsCommand().then(result => {
        if (result.success) {
            console.log('\n🎯 测试总结:');
            console.log(`   !news命令: ${result.usesRealData ? '✅ 使用真实爬虫数据' : '⚠️ 使用模拟数据'}`);
            console.log(`   新闻数量: ${result.newsCount}`);
            console.log(`   报告长度: ${result.reportLength} 字符`);
        }
    }).catch(console.error);
}

module.exports = { testNewsCommand };