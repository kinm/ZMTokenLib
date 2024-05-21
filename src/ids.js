// 为tokens/.../info.json 中没有ID的代币添加ID，ID从data/MarketTokens.json中获取
const fs = require('fs-extra');
const path = require('path');

/**
 * 读取指定目录下所有代币合约地址目录的info.json文件
 * @param {string} baseDir - 基础目录路径
 * @returns {Promise<Array>} - 包含所有info.json内容的数组
 */
const readAllInfoJson = async (baseDir) => {
    const result = [];
  
    const readDirectory = async (dirPath) => {
      const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
  
      for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
  
        if (file.isDirectory()) {
          // 递归读取子目录
          await readDirectory(fullPath);
        } else if (file.isFile() && file.name === 'info.json') {
          const data = await fs.promises.readFile(fullPath, 'utf-8');
          const jsonData = JSON.parse(data);
          result.push({ path: fullPath, data: jsonData });
        }
      }
    };
  
    // 读取baseDir下的所有子目录
    await readDirectory(baseDir);
    return result;
};

// 读取tokens文件目录 判断是否有ID
async function main (){
    const tokensDir = path.join(__dirname, '../tokens');
    const tokenDirs = await readAllInfoJson(tokensDir);
    const tokens = await fs.readJson(path.join(__dirname, '../data/MarketTokens.json'));

    for (const tokenDir of tokenDirs) {
        let tokenInfoPath = path.join(tokenDir.path);
        let tokenInfo = tokenDir.data;
        if (!tokenInfo.id) {
            // 从MarketTokens.json中查找ID
            let token = tokens.find(token => token.symbol === tokenInfo.symbol && token.name === tokenInfo.name);
            if (token) {
                tokenInfo.id = token.id;
                await fs.writeJson(tokenInfoPath, tokenInfo, { spaces: 4 });
            }
        }
    }  
}

main();