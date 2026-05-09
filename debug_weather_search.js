// 调试天气相关数据搜索问题
console.log('🔍 调试天气相关数据搜索问题...\n');

const https = require('https');

// CKAN API端点
const ckanAPI = 'https://data.gov.hk/tc-data/api/3/action';

// 测试不同的天气相关搜索词
const testCases = [
    {
        name: '搜索"天氣"（繁体中文）',
        url: `${ckanAPI}/package_search?q=天氣`
    },
    {
        name: '搜索"天气"（简体中文）',
        url: `${ckanAPI}/package_search?q=天气`
    },
    {
        name: '搜索"weather"（英文）',
        url: `${ckanAPI}/package_search?q=weather`
    },
    {
        name: '搜索"天文台"相关数据',
        url: `${ckanAPI}/package_search?q=天文台`
    },
    {
        name: '搜索"温度"相关数据',
        url: `${ckanAPI}/package_search?q=溫度`
    },
    {
        name: '搜索"气候"相关数据',
        url: `${ckanAPI}/package_search?q=氣候`
    },
    {
        name: '直接获取天文台所有数据',
        url: `${ckanAPI}/package_search?fq=organization:hk-hko`
    },
    {
        name: '搜索"气候"分类的数据',
        url: `${ckanAPI}/package_search?fq=groups:climate-and-weather`
    },
    {
        name: '获取所有数据集列表（检查是否有天气相关）',
        url: `${ckanAPI}/package_list`
    }
];

async function testAPI(url, testName) {
    console.log(`\n🌐 ${testName}`);
    console.log(`   URL: ${url}`);
    
    return new Promise((resolve) => {
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    success: res.statusCode === 200,
                    statusCode: res.statusCode,
                    data: data,
                    headers: res.headers
                });
            });
        });
        
        req.on('error', (error) => {
            resolve({
                success: false,
                error: error.message
            });
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            resolve({
                success: false,
                error: '请求超时'
            });
        });
    });
}

async function runTests() {
    for (const testCase of testCases) {
        const result = await testAPI(testCase.url, testCase.name);
        
        if (result.success) {
            console.log(`   ✅ 成功! 状态码: ${result.statusCode}`);
            
            try {
                const jsonData = JSON.parse(result.data);
                
                if (jsonData.result) {
                    if (Array.isArray(jsonData.result)) {
                        // package_list 返回数组
                        console.log(`   📊 数据集总数: ${jsonData.result.length}`);
                        
                        // 检查是否有天气相关的数据集
                        const weatherDatasets = jsonData.result.filter(name => 
                            name.toLowerCase().includes('weather') || 
                            name.toLowerCase().includes('climate') ||
                            name.toLowerCase().includes('hko')
                        );
                        
                        if (weatherDatasets.length > 0) {
                            console.log(`   🌤️ 天气相关数据集: ${weatherDatasets.length} 个`);
                            weatherDatasets.slice(0, 5).forEach((name, index) => {
                                console.log(`      ${index + 1}. ${name}`);
                            });
                        }
                    } else if (jsonData.result.results) {
                        // package_search 返回对象
                        console.log(`   📊 找到 ${jsonData.result.count || jsonData.result.results.length} 个数据集`);
                        
                        if (jsonData.result.results.length > 0) {
                            jsonData.result.results.slice(0, 3).forEach((dataset, index) => {
                                console.log(`      ${index + 1}. ${dataset.title || dataset.name}`);
                                if (dataset.organization) {
                                    console.log(`         部门: ${dataset.organization.title || dataset.organization.name}`);
                                }
                            });
                        }
                    }
                }
                
                // 显示原始响应的一部分以帮助调试
                if (jsonData.result && jsonData.result.results && jsonData.result.results.length === 0) {
                    console.log(`   🔍 原始响应: ${JSON.stringify(jsonData).substring(0, 300)}...`);
                }
                
            } catch (error) {
                console.log(`   📄 响应数据: ${result.data.substring(0, 300)}...`);
            }
        } else {
            console.log(`   ❌ 失败: ${result.error || result.statusCode}`);
            
            if (result.data) {
                try {
                    const errorData = JSON.parse(result.data);
                    console.log(`   📄 错误详情: ${JSON.stringify(errorData)}`);
                } catch (e) {
                    console.log(`   📄 错误响应: ${result.data.substring(0, 200)}...`);
                }
            }
        }
    }
}

// 运行测试
runTests().then(() => {
    console.log('\n🎯 问题分析:');
    console.log('   1. 搜索"天氣"返回0个数据集 - 可能是搜索词不匹配');
    console.log('   2. 需要检查数据集的实际标题和描述');
    console.log('   3. 可能需要使用英文关键词或特定部门搜索');
    console.log('   4. 或者天气数据可能在其他API中');
});