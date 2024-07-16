const solanaWeb3 = require("@solana/web3.js");
const { programs } = require("@metaplex/js");
const { Metadata } = programs.metadata;
class Solwallet {
  constructor(sol_rpc) {
    this.connection = new solanaWeb3.Connection(sol_rpc);
  }
  /**
   *
   * @param {string} address
   * @returns {boolean}
   */
  isSol(address) {
    try {
      const publicKey = new solanaWeb3.PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  }
  /**
   *
   * @param {String} address
   * @returns { Promise<Array<solanaWeb3.ConfirmedSignatureInfo>>}
   */
  async getSignatureArray(address) {
    const maxAttempts = 10; // 設置最大重試次數
    let attempts = 0;
    const initialDelay = 500; // 初始延遲時間
    while (attempts < maxAttempts) {
      // 無限迴圈
      try {
        let publicKey = new solanaWeb3.PublicKey(address);
        const Signatures = await this.connection.getSignaturesForAddress(
          publicKey,
          {
            limit: 5,
          }
        );
        if (Signatures) {
          return Signatures;
        }
      } catch (error) {
        console.log("getSignatureArray壞掉 可能RPC暫時死亡", error);
      }

      attempts++;
      const retryAfter = initialDelay * Math.pow(2, attempts); // 指數退避策略
      await new Promise((resolve) => setTimeout(resolve, retryAfter));
    }
    return [];
  }

  /**
   * 取得特定簽名的交易資訊
   * @param {string} signature - 交易簽名
   * @returns { Promise<solanaWeb3.ParsedTransactionWithMeta | null>} - 返回包含交易資訊的物件，如果失敗則返回 null
   */
  async getTransaction(signature) {
    const maxAttempts = 10; // 設置最大重試次數
    let attempts = 0;
    const initialDelay = 500; // 延遲時間
    while (attempts < maxAttempts) {
      // 無限迴圈
      try {
        const transaction = await this.connection.getParsedTransaction(
          signature,
          {
            maxSupportedTransactionVersion: 0,
          }
        );
        if (transaction) {
          return transaction; // 成功獲取交易，返回結果
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

  /**
   *
   * @param {string} token_address
   * @returns {string}
   */
  async getTokenName(token_address) {
    let metadataPDA = await Metadata.getPDA(token_address);
    let metadata = await Metadata.load(this.connection, metadataPDA);
    return metadata.data.data.name;
  }
  /**
   *
   * @param {number} lamport
   * @returns {number}
   */
  lamportToSol(lamport) {
    return lamport / solanaWeb3.LAMPORTS_PER_SOL;
  }
}
module.exports = Solwallet;
