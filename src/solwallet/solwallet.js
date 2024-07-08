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
    let publicKey = new solanaWeb3.PublicKey(address);
    return await this.connection.getSignaturesForAddress(publicKey, {
      limit: 5,
    });
  }
  /**
   * 取得特定簽名的交易資訊
   * @param {string} signature - 交易簽名
   * @returns { Promise<solanaWeb3.ParsedTransactionWithMeta | null>} - 返回包含交易資訊的物件，如果失敗則返回 null
   */
  async getTransaction(signature) {
    return await this.connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });
  }
  /**
   *
   * @param {string} token_address
   * @returns {string}
   */
  async getTokenName(token_address) {
    const metadataPDA = await Metadata.getPDA(token_address);
    const metadata = await Metadata.load(connection, metadataPDA);
    return metadata.data.data.name;
  }
}
module.exports = Solwallet;
