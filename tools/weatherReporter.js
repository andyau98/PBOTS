const https = require('https');

class WeatherReporter {
    constructor(config = {}) {
        this.config = config;
        this.baseUrl =
            'https://data.weather.gov.hk/weatherAPI/opendata/weather.php';
        console.log('🌤️ 香港天氣報告工具已初始化');
    }

    fetchApi(url) {
        return new Promise((resolve) => {
            https
                .get(url, (res) => {
                    let data = '';
                    res.on('data', (chunk) => (data += chunk));
                    res.on('end', () => {
                        try {
                            resolve(JSON.parse(data));
                        } catch {
                            resolve(null);
                        }
                    });
                })
                .on('error', () => resolve(null));
        });
    }

    async getHongKongWeather() {
        try {
            const weatherData = await this.fetchApi(
                `${this.baseUrl}?dataType=flw&lang=tc`
            );
            if (weatherData) {
                return {
                    success: true,
                    report: this.formatWeatherReport(weatherData),
                    source: '香港天文台',
                };
            }
            return {
                success: false,
                report: this.formatUnavailableReport(),
                source: null,
            };
        } catch (error) {
            console.error('❌ 獲取天氣資訊失敗:', error.message);
            return {
                success: false,
                report: this.formatUnavailableReport(),
                source: null,
            };
        }
    }

    async getWeatherWarnings() {
        try {
            const data = await this.fetchApi(
                `${this.baseUrl}?dataType=warnsum&lang=tc`
            );
            if (!data || !data.details || data.details.length === 0) {
                return {
                    hasWarnings: false,
                    text: '✅ 目前沒有生效的天氣警告',
                };
            }

            const lines = data.details.map((w) => {
                const iconMap = {
                    1: '⛈️',
                    2: '🌧️',
                    3: '⛰️',
                    4: '🔥',
                    5: '💨',
                    6: '🌊',
                    7: '❄️',
                    8: '🌡️',
                    9: '🌧️',
                    10: '⛈️',
                    11: '🥶',
                    12: '🔥',
                };
                const icon =
                    w.warningStatementCode && iconMap[w.warningStatementCode]
                        ? iconMap[w.warningStatementCode]
                        : '⚠️';
                return `${icon} *${w.contents || w.subtype || '天氣警告'}*\n${w.instruction || ''}`;
            });

            return { hasWarnings: true, text: lines.join('\n\n') };
        } catch (error) {
            console.error('❌ 獲取天氣警告失敗:', error.message);
            return { hasWarnings: false, text: '⚠️ 天氣警告資訊暫時無法獲取' };
        }
    }

    async getCompleteWeatherReport() {
        try {
            const weather = await this.getHongKongWeather();
            const warnings = await this.getWeatherWarnings();

            let report = weather.report;
            report += '\n\n🚨 *天氣警告*\n' + warnings.text;

            return { ...weather, report, hasWarnings: warnings.hasWarnings };
        } catch (error) {
            console.error('❌ 獲取完整天氣報告失敗:', error.message);
            return { success: false, report: this.formatUnavailableReport() };
        }
    }

    formatWeatherReport(data) {
        const now = new Date();
        const hkTime = new Date(
            now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' })
        );

        return (
            '🌤️ *香港天氣報告*\n\n' +
            `📅 報告時間: ${hkTime.toLocaleString('zh-HK', { hour12: false })}\n` +
            '📍 地區: 香港特別行政區\n\n' +
            `📊 *天氣概況*\n${data.generalSituation || '暫無'}\n\n` +
            `🔮 *今日預報*\n${data.forecastDesc || '暫無'}\n\n` +
            `🔭 *未來展望*\n${data.outlook || '暫無'}\n\n` +
            '📡 *數據來源: 香港天文台*'
        );
    }

    formatUnavailableReport() {
        const now = new Date();
        const hkTime = new Date(
            now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' })
        );

        return (
            '🌤️ *香港天氣報告*\n\n' +
            `📅 報告時間: ${hkTime.toLocaleString('zh-HK', { hour12: false })}\n` +
            '📍 地區: 香港特別行政區\n\n' +
            '⚠️ 天氣資訊暫時無法獲取，請稍後再試。\n' +
            '📡 數據來源: 香港天文台\n' +
            '🔗 https://www.hko.gov.hk'
        );
    }

    async getDetailedWeather() {
        const report = await this.getHongKongWeather();
        if (report.success) {
            report.report +=
                '\n\n🔗 *相關連結*\n• 香港天文台: https://www.hko.gov.hk\n• 天氣預測: https://www.weather.gov.hk';
        }
        return report;
    }
}

module.exports = WeatherReporter;
