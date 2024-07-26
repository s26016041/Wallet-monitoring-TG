const { ethers } = require("ethers");
/**
 * @typedef {Object} BlockReceipts
 * @property {string} blockNumber 
 * @property {Logs[]} logs
 */
/**
 * @typedef {Object} Logs
 * @property {string} address 
 * @property {string} transactionHash 
 */
class EthWallet {
    /**
     * 
     * @param {string} ethRpc 
     */
    constructor(ethRpc) {
        this.provider = new ethers.JsonRpcProvider(ethRpc);
    }
    /**
     * 
     * @returns {BlockReceipts[]|null}
     */
    // 獲取最新區塊交易哈希值
    async getBlockReceipts() {
        const maxAttempts = 10; // 設置最大重試次數
        let attempts = 0;
        const initialDelay = 500; // 延遲時間
        while (attempts < maxAttempts) {
            // 無限迴圈
            try {
                let blockReceipts = await this.provider.send("eth_getBlockReceipts", ["latest"]);
                if (blockReceipts) {
                    return blockReceipts; // 成功獲取交易，返回結果
                }
            } catch (error) {
                console.error("交易資訊 失敗 可能RPC 又掛了 馬上重試:", error);
            }
            attempts++;
            const retryAfter = initialDelay * Math.pow(2, attempts); // 指數退避策略
            await new Promise((resolve) => setTimeout(resolve, retryAfter));
        }
        return null;
    }
}
module.exports = EthWallet;