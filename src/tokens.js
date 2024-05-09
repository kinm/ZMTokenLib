const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Tokens 目录地址
const TOKENS_DIR = path.join(__dirname, '../tokens');

// 定义需要获取的代币平台
const PLATFORMS = [
    {
        pm_name: 'ethereum',
        pm_chain: 'ETH',
        pm_type: 'ERC20'
    },
    {
        pm_name: 'binance-smart-chain',
        pm_chain: 'BSC',
        pm_type: 'BEP20'
    },
];

// 定义获取代币列表的参数
const MarketPrams = {
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: 10000,
    page: 1,
    sparkline: false
}

// 等待指定时间
function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

// 读取MarketTokens
async function readMarketTokens() {
    return await fs.readJson(path.join(__dirname, '../data/MarketTokens.json'));
}

// 获取 CoinGecko 上的热门代币列表
async function fetchMarketTokens() {
    try {
        const url = `https://api.coingecko.com/api/v3/coins/markets?${new URLSearchParams(MarketPrams)}`;
        const response = await axios.get(url);
        // 与本地数据对比，只保留新数据
        const localTokens = await readMarketTokens();
        const resData = await processMarketData(response.data);
        // 过滤出新数据
        const newTokens = resData.filter(token => !localTokens.find(localToken => localToken.id === token.id));
        // 保存新数据到本地
        await fs.writeJson(path.join(__dirname, '../data/MarketTokens.json'), [...localTokens,...newTokens], { spaces: 4 });
        console.log('Market tokens fetched successfully.');
        // 返回新数据在本地存储的开始下标
        return localTokens.length;
    } catch (error) {
        console.error('Failed to fetch market tokens:', error);
        return [];
    }
}

// 处理市场代币数据
async function processMarketData(data) {
    // 定义结果数组
    const result = [];
    // 遍历代币数据
    for (const token of data) {
        result.push({
            id: token.id,
            name: token.name,
            symbol: token.symbol
        });
    }
    // 返回处理后的结果
    return result;
}

// 处理代币详情数据
async function processTokenData(data) {
    // 定义结果数组
    const result = [];
    // 根据代币平台处理数据
    for (const platform of PLATFORMS) {
        if (data.detail_platforms[platform.pm_name]) {
            result.push({
                name: data.name,
                symbol: data.symbol,
                contractAddress: data.detail_platforms[platform.pm_name].contract_address,
                decimals: data.detail_platforms[platform.pm_name].decimal_place,
                website: data.links.homepage[0], // 需要替换为实际的网址
                description: data.description.en,
                type: platform.pm_type,
                chain: platform.pm_chain,
                logo: data.image.large
            });
        }
    }
    // 返回处理后的结果
    return result;
}

// 获取新数据中代币的详细信息
async function fetchTokenDetails(tokenId) {
    try {
        const url = `https://api.coingecko.com/api/v3/coins/${tokenId}`;
        const response = await axios.get(url);
        const data = response.data;
        return await processTokenData(data);
    } catch (error) {
        console.error(`Failed to fetch details for ${tokenId}:`, error);
        return null;
    }
}

// 添加新代币与Logo至本地Tokens目录
async function addNewToken(tokenDetails) {
    // 创建代币目录
    const tokenDir = path.join(TOKENS_DIR, tokenDetails.chain.toLowerCase(), tokenDetails.contractAddress.toLowerCase());
    await fs.ensureDir(tokenDir);
    // 保存代币信息到 info.json 文件
    await fs.writeJson(path.join(tokenDir, 'info.json'), tokenDetails, { spaces: 4 });
    // 将 logo 图片下载到本地
    const logoPath = path.join(tokenDir, 'logo.png');
    const logoUrl = tokenDetails.logo;
    const writer = fs.createWriteStream(logoPath);
    const response = await axios({
        url: logoUrl,
        method: 'GET',
        responseType: 'stream'
    });
    response.data.pipe(writer);
    console.log(`Add token: ${tokenDetails.name}`);
}

// 主函数
async function main() {
    let startIndex = await fetchMarketTokens();
    let marketTokensData = await readMarketTokens();
    for (let i = startIndex; i < marketTokensData.length; i++) {
        const token = marketTokensData[i];
        const tokenDetails = await fetchTokenDetails(token.id);
        if (tokenDetails === null ) {
            // 当请求失败时，等待一分钟后重试
            await sleep(60000);
            i--;
            continue;
        }

        if(tokenDetails.length === 0){
            continue;
        }

        for (const tokenDetail of tokenDetails) {
            await addNewToken(tokenDetail);
        }
    }
}

// 运行主函数
main();
