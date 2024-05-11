const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// 读取MarketTokens
async function readMarketTokens() {
    return await fs.readJson(path.join(__dirname, '../data/MarketTokens.json'));
}

// 获取代币的详细信息
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

// 保存新数据到本地
async function saveNewTokens(newTokens) {
    const localTokens = await readMarketTokens();
    const resData = await processMarketData(response.data);
    // 过滤出新数据
    const newTokens = resData.filter(token => !localTokens.find(localToken => localToken.id === token.id));
    // 保存新数据到本地
    await fs.writeJson(path.join(__dirname, '../data/MarketTokens.json'), [...localTokens,...newTokens], { spaces: 4 });
}