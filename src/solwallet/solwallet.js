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
    try {
      console.log("----------------",address)

      let publicKey = new solanaWeb3.PublicKey(address);
      return await this.connection.getSignaturesForAddress(publicKey, {
        limit: 5,
      });
    } catch (error) {
      console.log("----------------",address)

      console.log("getSignatureArray壞掉 可能RPC暫時死亡",error);
      let publicKey = new solanaWeb3.PublicKey(address);
      return await this.connection.getSignaturesForAddress(publicKey, {
        limit: 5,
      });
    }
  }
  /**
   * 取得特定簽名的交易資訊
   * @param {string} signature - 交易簽名
   * @returns { Promise<solanaWeb3.ParsedTransactionWithMeta | null>} - 返回包含交易資訊的物件，如果失敗則返回 null
   */
  async getTransaction(signature) {
    try {
      console.log("----------------",signature)

      return await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });
    } catch (error) {
      console.log("----------------",signature)

      console.error("交易資訊 失敗 可能RPC 又掛了 馬上重試:", error);
      return await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });
    }
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
