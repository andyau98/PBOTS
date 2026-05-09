// 测试具体的HK01新闻文章
const https = require('https');

const testUrl = 'https://www.hk01.com/%E7%A4%BE%E6%9C%83%E6%96%B0%E8%81%9E/60341095/%E5%AE%8F%E7%A6%8F%E8%8B%91%E8%81%BD%E8%AD%89%E6%9C%83-%E5%9C%B0%E7%9B%A4%E5%B7%A5%E4%BA%BA%E7%A8%B1%E8%A6%8B%E8%B5%B7%E7%81%AB%E6%9B%BE%E7%94%A8%E6%B0%B4%E5%96%89%E6%95%91%E7%81%AB-%E4%BD%8620%E8%87%B330%E7%A7%92%E5%BE%8C%E7%84%A1%E6%B0%B4?itm_source=universal_search&itm_campaign=hk01&itm_content=all&itm_medium=web';

async function testSpecificArticle() {
    console.log('🧪 测试具体HK01新闻文章...\n');
    console.log(`📰 文章网址: ${testUrl}\n`);
    
    try {
        // 获取页面内容
        const html = await fetchPage(testUrl);
        console.log(`✅ 成功获取页面 (${html.length} 字节)\n`);
        
        // 分析URL结构
        console.log('🔍 URL结构分析:');
        const urlParts = testUrl.split('/');
        console.log(`   域名: ${urlParts[2]}`);
        console.log(`   分类: ${decodeURIComponent(urlParts[3])}`);
        console.log(`   文章ID: ${urlParts[4]}`);
        console.log(`   标题: ${decodeURIComponent(urlParts[5])}`);
        console.log(`   参数: ${urlParts[6]}\n`);
        
        // 提取标题
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].replace(' - 香港01', '').trim() : '';
        console.log(`📋 页面标题: ${title}\n`);
        
        // 提取日期
        const datePatterns = [
            /<meta[^>]*property="article:published_time"[^>]*content="([^"]+)"/i,
            /<time[^>]*datetime="([^"]+)"/i,
            /<span[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/span>/i
        ];
        
        let foundDate = '未找到日期';
        for (const pattern of datePatterns) {
            const match = html.match(pattern);
            if (match) {
                foundDate = match[1];
                break;
            }
        }
        console.log(`📅 发布日期: ${foundDate}\n`);
        
        // 提取描述
        const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
        const description = descMatch ? descMatch[1] : '未找到描述';
        console.log(`📝 页面描述: ${description}\n`);
        
        // 提取内容
        console.log('🔍 尝试提取内容...');
        const contentPatterns = [
            /<div[^>]*class="[^"]*article-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            /<article[^>]*>([\s\S]*?)<\/article>/i,
            /<p[^>]*>([^<]+)<\/p>/gi
        ];
        
        let content = '';
        for (const pattern of contentPatterns) {
            const match = html.match(pattern);
            if (match) {
                const extracted = match[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                if (extracted.length > 100) {
                    content = extracted.substring(0, 300);
                    break;
                }
            }
        }
        
        if (content) {
            console.log(`📄 提取内容 (前300字符): ${content}...\n`);
        } else {
            console.log('❌ 无法提取内容\n');
        }
        
        // 检查是否包含关键词
        const fullText = `${title} ${description} ${content}`.toLowerCase();
        const keywords = ['地盤', '工人', '起火', '救火'];
        console.log('🔍 关键词检查:');
        keywords.forEach(keyword => {
            const found = fullText.includes(keyword.toLowerCase());
            console.log(`   ${keyword}: ${found ? '✅' : '❌'}`);
        });
        
        console.log('\n🎯 测试完成！');
        
    } catch (error) {
        console.error(`❌ 测试失败: ${error.message}`);
    }
}

async function fetchPage(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return fetchPage(res.headers.location).then(resolve).catch(reject);
            }
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('请求超时'));
        });
    });
}

// 运行测试
testSpecificArticle().catch(console.error);