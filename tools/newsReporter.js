const RealNewsFetcher = require('./realNewsFetcher');

class NewsReporter {
    constructor(config = {}) {
        this.config = config;
        this.newsFetcher = new RealNewsFetcher(config);
        console.log('📰 香港地盤意外新聞工具已初始化（Google News 即時新聞）');
    }

    /**
     * 獲取香港地盤意外新聞
     */
    async getConstructionAccidentNews() {
        try {
            console.log('📰 正在從 Google News 獲取香港地盤意外新聞...');

            const articles = await this.newsFetcher.getConstructionAccidentNews();

            // 進一步篩選地盤相關內容
            const filteredArticles = articles.filter(article =>
                this.isConstructionRelated(article.title) ||
                this.isConstructionRelated(article.description)
            );

            if (filteredArticles.length > 0) {
                console.log(`✅ 找到 ${filteredArticles.length} 條真實地盤相關新聞`);
                return this.newsFetcher.formatNewsReport(filteredArticles);
            }

            // 如果篩選後沒結果，顯示原始結果
            if (articles.length > 0) {
                console.log(`✅ 找到 ${articles.length} 條新聞（未完全匹配地盤關鍵詞）`);
                return this.newsFetcher.formatNewsReport(articles.slice(0, 10));
            }

            console.log('ℹ️ 暫無相關新聞');
            return this.newsFetcher.formatNewsReport([]);

        } catch (error) {
            console.error('❌ 獲取新聞資訊失敗:', error.message);
            return this.newsFetcher.formatNewsReport([]);
        }
    }

    /**
     * 判斷是否為地盤相關內容
     */
    isConstructionRelated(text) {
        if (!text) return false;

        const constructionKeywords = [
            '地盤', '建築', '施工', '高空', '倒塌', '天秤', '吊臂', '工業意外',
            '地盤意外', '建築地盤', '施工安全', '高空作業', '地盤事故',
            '工業安全', '建築安全', '塔吊', '起重機', '安全帽', '防護裝備',
            '勞工處', '發展局', '地盤巡查', '安全檢查', '違規施工',
            '工傷', '工殤', '奪命', '致命', '死亡', '受傷', '墮下', '墮',
            '升降機', '工字鐵', '風煤樽', '水缸', '鋼筋', '觸電', '壓斃',
            '建造業', '建造', '工地', '工人', '承建商', '孫玉菡'
        ];

        return constructionKeywords.some(keyword =>
            text.toLowerCase().includes(keyword.toLowerCase())
        );
    }
}

module.exports = NewsReporter;
