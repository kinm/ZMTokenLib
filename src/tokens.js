const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const TOKENS_DIR = path.join(__dirname, 'tokens');

// 获取 CoinGecko 上的代币市场列表
async function fetchMarketTokens() {
    try {
        const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`;
        const response = await axios.get(url);
        console.log('Fetched market tokens successfully:', response.data);
        return response.data; // 返回基本的代币列表
    } catch (error) {
        console.error('Failed to fetch market tokens:', error);
        return [];
    }
}

// 获取代币的详细信息
async function fetchTokenDetails(tokenId) {
    try {
        const url = `https://api.coingecko.com/api/coins/${tokenId}`;
        const response = await axios.get(url);
        const data = response.data;
        console.log(`Fetched token details for ${tokenId} successfully:`, data);
        return {
            name: data.name,
            symbol: data.symbol,
            contractAddress: data.platforms.ethereum || '', // 示例，取决于数据结构
            decimals: 18, // 默认值，可能需要调整
            website: data.links.homepage[0],
            description: data.description.en.split('\n')[0], // 简化描述
            type: 'ERC20', // 根据具体情况调整
            chain: data.asset_platform_id.toUpperCase() // 根据实际链设置
        };
    } catch (error) {
        console.error(`Failed to fetch details for ${tokenId}:`, error);
        return null;
    }
}

// 添加新代币
async function addNewToken(tokenDetails) {
    if (tokenDetails) {
        const tokenDir = path.join(TOKENS_DIR, tokenDetails.chain.toLowerCase(), tokenDetails.symbol.toLowerCase());
        await fs.ensureDir(tokenDir);
        await fs.writeJson(path.join(tokenDir, 'info.json'), tokenDetails, { spaces: 2 });
        console.log(`Added/Updated token: ${tokenDetails.name}`);
    }
}

async function main() {
    await fetchMarketTokens();
    // const marketTokens = await fetchMarketTokens();
    // for (const token of marketTokens) {
    //     const tokenDetails = await fetchTokenDetails(token.id);
    //     if (tokenDetails) {
    //         await addNewToken(tokenDetails);
    //     }
    // }
}

main();
