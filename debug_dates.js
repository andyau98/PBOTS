// 调试日期计算问题
function debugDates() {
    console.log('🔍 调试日期计算问题...\n');
    
    const now = new Date();
    console.log('📅 当前系统时间:');
    console.log(`   完整时间: ${now}`);
    console.log(`   年份: ${now.getFullYear()}`);
    console.log(`   月份: ${now.getMonth() + 1}`);
    console.log(`   日期: ${now.getDate()}`);
    
    // 测试日期计算函数
    const getTodayDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    };
    
    const getYesterdayDate = () => {
        const now = new Date();
        now.setDate(now.getDate() - 1);
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    };
    
    const getDateMonthsAgo = (months) => {
        const now = new Date();
        now.setMonth(now.getMonth() - months);
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    };
    
    console.log('\n📅 日期计算结果:');
    console.log(`   今天: ${getTodayDate()}`);
    console.log(`   昨天: ${getYesterdayDate()}`);
    console.log(`   1个月前: ${getDateMonthsAgo(1)}`);
    console.log(`   3个月前: ${getDateMonthsAgo(3)}`);
    console.log(`   6个月前: ${getDateMonthsAgo(6)}`);
    
    // 检查6个月前计算是否正确
    const sixMonthsAgo = getDateMonthsAgo(6);
    const sixMonthsAgoDate = new Date(
        parseInt(sixMonthsAgo.substring(0, 4)),
        parseInt(sixMonthsAgo.substring(4, 6)) - 1,
        parseInt(sixMonthsAgo.substring(6, 8))
    );
    
    console.log('\n🔍 6个月前日期验证:');
    console.log(`   6个月前日期: ${sixMonthsAgo}`);
    console.log(`   日期对象: ${sixMonthsAgoDate}`);
    console.log(`   是否未来日期: ${sixMonthsAgoDate > now ? '是' : '否'}`);
    
    // 测试正确的日期范围
    console.log('\n📅 正确的日期范围测试:');
    const correctRanges = [
        { months: 12, name: "1年" },
        { months: 6, name: "6个月" },
        { months: 3, name: "3个月" },
        { months: 1, name: "1个月" }
    ];
    
    correctRanges.forEach(range => {
        const startDate = getDateMonthsAgo(range.months);
        const endDate = getYesterdayDate();
        console.log(`   ${range.name}范围: ${startDate} 至 ${endDate}`);
    });
}

// 运行调试
debugDates();