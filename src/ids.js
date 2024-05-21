// 为tokens/.../info.json 中没有ID的代币添加ID，ID从data/MarketTokens.json中获取
const fs = require('fs-extra');
const path = require('path');

// 读取tokens/.../info.json文件 判断是否有ID
const tokensDir = path.join(__dirname, '../tokens');
const tokenDirs = await fs.readdir(tokensDir);
const tokens = await fs.readJson(path.join(__dirname, '../data/MarketTokens.json'));

for (const tokenDir of tokenDirs) {
    let tokenInfoPath = path.join(tokensDir, tokenDir, 'info.json');
    let tokenInfo = await fs.readJson(tokenInfoPath);
    if (!tokenInfo.id) {
        // 从MarketTokens.json中查找ID
        let token = tokens.find(token => token.symbol === tokenInfo.symbol);
        if (token) {
            tokenInfo.id = token.id;
            await fs.writeJson(tokenInfoPath, tokenInfo, { spaces: 4 });
        }
    }
}  