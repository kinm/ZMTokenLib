const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const API_BASE_URL = 'https://api.coingecko.com/api/v3/coins/markets';
const CHAINS = {
    'eth': {
        'id': 'ethereum',
        'tokenType': 'ERC20',
        'directory': 'eth'
    },
    'bsc': {
        'id': 'binancecoin',
        'tokenType': 'BEP20',
        'directory': 'bsc'
    }
};

async function fetchTokens(chainKey) {
    const params = {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 10,
        page: 1,
        sparkline: false,
        price_change_percentage: '24h'
    };

    try {
        const response = await axios.get(API_BASE_URL, { params });
        return response.data;
    } catch (error) {
        console.error(`Error fetching data for ${chainKey}:`, error);
        return [];
    }
}

async function fetchTokenDetails(tokenId) {
    // sleep for 1 second to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Fetch token details from Coingecko API
    const url = `https://api.coingecko.com/api/v3/coins/${tokenId}`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching details for token ${tokenId}:`, error);
        return null;
    }
}

async function saveTokenData(token, chainKey) {
    const chain = CHAINS[chainKey];
    const tokenDir = path.join(__dirname, 'tokens', 'automated', chain.directory, token.id);
    await fs.ensureDir(tokenDir);

    const info = {
        name: token.name,
        symbol: token.symbol,
        contractAddress: token.contract_address || token.platforms[chain.id] || 'N/A',
        decimals: token.decimals || 18,
        website: token.links?.homepage[0] || 'No website provided',
        description: token.description?.en || 'No description available',
        type: chain.tokenType,
        chain: chainKey,
    };

    await fs.writeJson(path.join(tokenDir, 'info.json'), info, { spaces: 2 });

    const logoPath = path.join(tokenDir, 'logo.png');
    if (token.image && !fs.existsSync(logoPath)) {
        const imageResponse = await axios.get(token.image.large || token.image, { responseType: 'arraybuffer' });
        await fs.writeFile(logoPath, imageResponse.data);
    }
}

async function main() {
    for (const chainKey of Object.keys(CHAINS)) {
        if (chainKey != 'bsc') {
            continue;
        }
        const tokens = await fetchTokens(chainKey);
        for (const token of tokens) {
            const tokenDetails = await fetchTokenDetails(token.id);
            if (tokenDetails) {
                await saveTokenData(tokenDetails, chainKey);
            }
        }
    }
}

main().catch(console.error);