/**
 * @typedef {Object} WalletData
 * @property {string} signature - The wallet signature.
 * @property {number} slot - The slot number.
 */
class State {
  constructor() {
    /**
     * @type {Map<string,string>}
     */
    this.sol_wallet_map = new Map();
    /**
     * @type {boolean}
     */
    this.sol_add_wallet = false;
    /**
     * @type {boolean}
     */
    this.sol_delete_wallet = false;
    /**
     * @type {Map<string,WalletData>}
     */
    this.sol_address_signature = new Map();
  }
  /**
   *
   * @returns {Map<string,string>}
   */
  getSolWalletMap() {
    return this.sol_wallet_map;
  }
  /**
   *
   * @returns {boolean}
   */
  getAddSolWallet() {
    return this.sol_add_wallet;
  }
  /**
   *
   * @returns {boolean}
   */
  getDeleteSolWallet() {
    return this.sol_delete_wallet;
  }
  /**
   *
   * @returns {Map<string,WalletData>}
   */
  getSolAddressSignature() {
    return this.sol_address_signature;
  }
  /**
   *
   * @param {string} address
   * @param {string} name
   */
  setSolWalletMap(address, name) {
    this.sol_wallet_map.set(address, name);
  }
  /**
   *
   * @param {string} address
   *
   */
  deleteSolWalletMap(address) {
    this.sol_wallet_map.delete(address);
  }
  /**
   *
   * @param {string} address
   * @param {string} signature
   * @param {number} slot
   */
  setSolAddressSignature(address, signature, slot) {
    this.sol_address_signature.set(address, { signature, slot });
  }
  /**
   *
   * @param {Boolean} bool
   */
  setSolAddWallet(bool) {
    this.sol_add_wallet = bool;
  }
  /**
   *
   * @param {Boolean} bool
   */
  setSolDeleteWallet(bool) {
    this.sol_delete_wallet = bool;
  }
}
module.exports = State;
