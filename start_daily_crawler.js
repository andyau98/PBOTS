/**
 * 啟動每日自動更新爬蟲記錄
 * 設定爬蟲每天自動運行，更新地盤相關新聞數據庫
 */

const HK01DailyCrawler = require('./tools/HK01DailyCrawler');

async function startDailyCrawler() {
    console.log('🚀 啟動HK01每日自動更新爬蟲系統...\n');
    
    try {
        // 1. 初始化每日爬蟲
        console.log('1️⃣ 初始化每日爬蟲...');
        const dailyCrawler = new HK01DailyCrawler({
            enableScheduler: true,
            dailyUpdateTime: '06:00', // 每日凌晨6點更新
            maxArticlesPerDay: 100,
            dataPath: './data/hk01_daily_news_database.json'
        });
        
        // 2. 顯示當前數據庫狀態
        console.log('\n2️⃣ 當前數據庫狀態:');
        const stats = dailyCrawler.getDatabaseStats();
        console.log(JSON.stringify(stats, null, 2));
        
        // 3. 啟動每日爬蟲
        console.log('\n3️⃣ 啟動每日自動更新...');
        await dailyCrawler.startDailyCrawler();
        
        // 4. 顯示爬蟲配置
        console.log('\n4️⃣ 爬蟲配置信息:');
        console.log(`   • 每日更新時間: ${dailyCrawler.config.dailyUpdateTime}`);
        console.log(`   • 定時任務: ${dailyCrawler.config.schedule}`);
        console.log(`   • 實時檢查間隔: ${dailyCrawler.config.realtimeCheckInterval / 60000} 分鐘`);
        console.log(`   • 每日最大文章數: ${dailyCrawler.config.maxArticlesPerDay}`);
        console.log(`   • 數據庫路徑: ${dailyCrawler.config.dataPath}`);
        
        // 5. 立即執行一次爬取測試
        console.log('\n5️⃣ 執行首次爬取測試...');
        const crawlResult = await dailyCrawler.crawlToday();
        
        console.log('📋 首次爬取結果:');
        console.log(JSON.stringify({
            success: crawlResult.success,
            date: crawlResult.date,
            totalArticles: crawlResult.totalArticles,
            newArticles: crawlResult.newArticles,
            error: crawlResult.error || '無錯誤'
        }, null, 2));
        
        // 6. 顯示更新後的數據庫狀態
        console.log('\n6️⃣ 更新後數據庫狀態:');
        const updatedStats = dailyCrawler.getDatabaseStats();
        console.log(JSON.stringify(updatedStats, null, 2));
        
        // 7. 測試地盤相關新聞搜索
        console.log('\n7️⃣ 測試地盤相關新聞搜索...');
        
        const constructionKeywords = [
            '地盤', '工傷', '意外', '安全', '建築', '施工', '高空', '倒塌',
            '天秤', '吊臂', '工業意外', '地盤意外', '建築地盤', '施工安全'
        ];
        
        const constructionArticles = dailyCrawler.searchArticles(constructionKeywords, 10);
        console.log(`🔍 找到 ${constructionArticles.length} 篇地盤相關新聞`);
        
        if (constructionArticles.length > 0) {
            console.log('📰 地盤相關新聞示例:');
            constructionArticles.slice(0, 5).forEach((article, index) => {
                console.log(`\n${index + 1}. ${article.title}`);
                console.log(`   日期: ${article.publishDate}`);
                console.log(`   分類: ${article.category}`);
                console.log(`   鏈接: ${article.url}`);
            });
        }
        
        console.log('\n✅ HK01每日自動更新爬蟲系統啟動成功！');
        
        console.log('\n📱 系統功能:');
        console.log('   ✅ 每日自動更新新聞數據庫');
        console.log('   ✅ 只抽取地盤相關訊息');
        console.log('   ✅ 支持多個定時任務');
        console.log('   ✅ 實時檢查最新文章');
        console.log('   ✅ 完整的數據庫管理');
        
        console.log('\n⏰ 自動更新時間表:');
        console.log('   • 每日 06:00 - 主要更新');
        console.log('   • 每日 09:00 - 上午更新');
        console.log('   • 每日 15:00 - 下午更新');
        console.log('   • 每日 21:00 - 晚間更新');
        console.log('   • 每30分鐘 - 實時檢查');
        
        console.log('\n💡 使用說明:');
        console.log('   1. 系統會自動在指定時間更新新聞數據');
        console.log('   2. !news命令會從最新數據庫中獲取地盤相關新聞');
        console.log('   3. 數據庫會自動去重和更新');
        console.log('   4. 支持手動觸發爬取和檢查');
        
        // 返回爬蟲實例，以便後續使用
        return {
            success: true,
            crawler: dailyCrawler,
            stats: updatedStats,
            constructionArticles: constructionArticles.length
        };
        
    } catch (error) {
        console.error('❌ 啟動每日爬蟲失敗:', error.message);
        console.error(error.stack);
        return { success: false, error: error.message };
    }
}

// 創建系統監控函數
function setupSystemMonitoring(crawler) {
    console.log('\n🔍 設置系統監控...');
    
    // 監控爬蟲狀態
    setInterval(() => {
        if (crawler.isRunning) {
            const stats = crawler.getDatabaseStats();
            console.log(`📊 系統運行中 - 數據庫: ${stats.totalArticles} 篇文章`);
        }
    }, 60 * 60 * 1000); // 每小時檢查一次
    
    console.log('✅ 系統監控已設置');
}

// 主啟動函數
async function main() {
    console.log('🎯 HK01每日自動更新爬蟲系統啟動程序\n');
    
    const result = await startDailyCrawler();
    
    if (result.success) {
        // 設置系統監控
        setupSystemMonitoring(result.crawler);
        
        console.log('\n🎉 系統啟動完成！');
        console.log(`📊 總文章數: ${result.stats.totalArticles} 篇`);
        console.log(`🔍 地盤相關: ${result.constructionArticles} 篇`);
        console.log(`📅 日期範圍: ${result.stats.dateRange.start} 至 ${result.stats.dateRange.end}`);
        
        console.log('\n💡 下一步行動:');
        console.log('   1. 系統會自動在指定時間更新');
        console.log('   2. 使用 !news 命令測試地盤新聞');
        console.log('   3. 檢查數據庫更新情況');
        
        // 保持程序運行
        console.log('\n🔄 系統持續運行中... (按 Ctrl+C 停止)');
        
        // 保持程序運行
        process.on('SIGINT', () => {
            console.log('\n🛑 收到停止信號，關閉爬蟲...');
            result.crawler.stopDailyCrawler();
            console.log('✅ 爬蟲已停止，程序退出');
            process.exit(0);
        });
        
        // 保持程序運行
        setInterval(() => {
            // 空閒循環，保持程序運行
        }, 1000);
        
    } else {
        console.log('❌ 系統啟動失敗');
        process.exit(1);
    }
}

// 執行啟動
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 啟動程序錯誤:', error.message);
        process.exit(1);
    });
}

module.exports = { startDailyCrawler };