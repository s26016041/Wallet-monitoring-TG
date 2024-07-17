const SolWallet = require("../solwallet/solwallet.js");
const parameters = require("../parameter/parameter.js");
const TelegramBot = require("node-telegram-bot-api");
const sol_token_mint = "So11111111111111111111111111111111111111112"
const State = require("../state/State.js");

const axios = require("axios");
const fs = require("fs");
/**
 * @typedef {Object} SolJsonData
 * @property {number} chat_id - The wallet signature.
 * @property {SolWalletData[]} sol_wallet - The slot number.
 */

/**
 * @typedef {Object} SolWalletData
 * @property {string} address - The wallet signature.
 * @property {string} name - The slot number.
 */

class ChatStates {
  constructor(bot) {
    /**
     * @type {Map<string,State>}
     */
    this.states = new Map();
    /**
     * @type {SolWallet}
     */
    this.sol_wallet = new SolWallet(parameters.SOLRPC);
    /**
     * @type {TelegramBot}
     */
    this.bot = bot;
    this.downloadJson();

    this.start();
    this.getSolPrice();
  }

  // 讀檔
  downloadJson() {
    // 检查文件是否存在
    if (!fs.existsSync("solData.json")) {
      console.warn("文件不存在。");
      return;
    }

    const data = fs.readFileSync("solData.json", "utf-8");

    // 检查文件是否为空
    if (data.trim().length === 0) {
      console.warn("文件为空。");
      return;
    }
    /**
     *  @type {SolJsonData[]}
     */
    const jsonDatas = JSON.parse(data);
    for (let jsonData of jsonDatas) {
      this.initialization(jsonData.chat_id);
      for (let sol_wallet of jsonData.sol_wallet) {
        this.states
          .get(jsonData.chat_id)
          .setSolWalletMap(sol_wallet.address, sol_wallet.name);
      }
    }
  }
  // 存檔
  saveJson() {
    let save_data = [];

    for (let [chat_id, data] of this.states) {
      let sol_wallet = [];
      for (let [address, name] of data.getSolWalletMap()) {
        sol_wallet.push({ address: address, name, name });
      }
      save_data.push({ chat_id: chat_id, sol_wallet: sol_wallet });
    }
    fs.writeFileSync(
      "solData.json",
      JSON.stringify(save_data, null, 2),
      "utf-8"
    );
  }
  // SOL 價格
  async getSolPrice() {
    let response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    );
    this.sol_usd = response.data.solana.usd;
  }
  start() {
    this.solPriceUsd = setInterval(async () => {
      this.getSolPrice();
    }, 600000);
    this.printFiveInterval = setInterval(async () => {
      try {
        for (let [chat_id, data] of this.states) {
          if (
            data &&
            data.getSolWalletMap() &&
            data.getSolWalletMap().size > 0
          ) {
            for (let [address, name] of data.getSolWalletMap()) {
              let SignatureArray = await this.sol_wallet.getSignatureArray(
                address
              );
              if (SignatureArray.length == 0) {
                continue;
              }
              // 沒有最後一筆哈希的話幫她添加
              if (!data.getSolAddressSignature().has(address)) {
                this.states
                  .get(chat_id)
                  .setSolAddressSignature(
                    address,
                    SignatureArray[0].signature,
                    SignatureArray[0].slot
                  );
                continue;
              }
              // console.log(address)
              // console.log(this.states.get(chat_id).getSolAddressSignature())
              // 把新的哈希交易都通知
              for (let signature of SignatureArray) {
                if (
                  signature.signature ==
                  data.getSolAddressSignature().get(address).signature ||
                  signature.slot <
                  data.getSolAddressSignature().get(address).slot
                ) {
                  break;
                }
                if (signature.err != null) {
                  continue;
                }
                let transaction = await this.sol_wallet.getTransaction(
                  signature.signature
                );

                // console.log(transaction)
                // 一些特殊交易室會回傳未定義
                if (
                  !transaction ||
                  !transaction.meta ||
                  !transaction.meta.postTokenBalances ||
                  transaction.meta.postTokenBalances.length === 0 ||
                  !transaction.meta.preTokenBalances ||
                  transaction.meta.preTokenBalances.length === 0 ||
                  transaction == null
                ) {
                  continue;
                }
                if (
                  transaction.transaction.message.accountKeys[
                    0
                  ].pubkey.toString() != address
                ) {
                  continue;
                }
                let solscan_wallet_url = `https://solscan.io/account/${address}`;
                let telegram_message = ``;
                let gas = transaction.meta.fee
                let post_sol = transaction.meta.postBalances;
                let post_token = transaction.meta.postTokenBalances;
                let pre_sol = transaction.meta.preBalances;
                let pre_token = transaction.meta.preTokenBalances;
                let token_sol = 0
                let token_address,
                  token_name,
                  accountIndex = 0,
                  lamports,
                  photon_url,
                  solscan_token_url,
                  price,
                  signature_url;
                let token_number = 0;
                let sol_number = 0;

                telegram_message += `[<a href="${solscan_wallet_url}">${name}</a>]\n`;
                for (let pre_token_data of pre_token) {
                  if (pre_token_data.owner === address) {
                    if (pre_token_data.mint == sol_token_mint) {
                      token_sol += pre_token_data.uiTokenAmount.uiAmount
                    } else {
                      token_address = pre_token_data.mint;
                      if (pre_token_data.uiTokenAmount.uiAmount != null) {
                        token_number += pre_token_data.uiTokenAmount.uiAmount;
                      }
                    }

                  }
                }
                for (let post_token_data of post_token) {
                  if (post_token_data.owner === address) {
                    if (post_token_data.mint == sol_token_mint) {
                      token_sol -= post_token_data.uiTokenAmount.uiAmount
                    } else {
                      token_address = post_token_data.mint;
                      if (post_token_data.uiTokenAmount.uiAmount != null) {
                        token_number -= post_token_data.uiTokenAmount.uiAmount;
                      }
                    }

                  }
                }
                solscan_token_url = `https://solscan.io/token/${token_address}`;
                token_name = await this.sol_wallet.getTokenName(token_address);
                lamports = (pre_sol[accountIndex]) - post_sol[accountIndex];
                // console.log("gas: ", gas)
                // console.log("pre_sol: ", pre_sol[accountIndex])
                // console.log("post_sol: ", post_sol[accountIndex])
                // console.log("lamports: ", lamports)
                if (token_sol == 0) {
                  sol_number = this.sol_wallet.lamportToSol(Math.abs(lamports));
                  price = (sol_number * this.sol_usd) / Math.abs(token_number);
                } else {
                  sol_number = Math.abs(token_sol);
                  price = (token_sol * this.sol_usd) / Math.abs(token_number);
                }
                photon_url = `https://photon-sol.tinyastro.io/zh/lp/${token_address}`;
                signature_url = `https://solscan.io/tx/${signature.signature}`;
                if (token_number < 0) {
                  telegram_message += `🔴 賣 ${sol_number} SOL\n`;
                  telegram_message += `🟢 買 ${Math.abs(
                    token_number
                  )} [<a href="${solscan_token_url}">${token_name}</a>]\n`;
                  telegram_message += `價格: ${price}\n`;
                  telegram_message += `<a href="${photon_url}">photon</a>\n`;
                  telegram_message += `代幣地址: <code>${token_address}</code>\n`;
                  telegram_message += `<a href="${signature_url}">交易情況</a>\n`;
                } else {
                  telegram_message += `🔴 賣 ${Math.abs(
                    token_number
                  )} [<a href="${solscan_token_url}">${token_name}</a>]\n`;
                  telegram_message += `🟢 買 ${sol_number} SOL\n`;
                  telegram_message += `價格: ${price}\n`;
                  telegram_message += `<a href="${photon_url}">photon</a>\n`;
                  telegram_message += `代幣地址: <code>${token_address}</code>\n`;
                  telegram_message += `<a href="${signature_url}">交易情況</a>\n`;
                }

                this.bot.sendMessage(chat_id, telegram_message, {
                  parse_mode: "HTML",
                  disable_web_page_preview: true,
                });
                // 換成最新的哈希
                data.setSolAddressSignature(
                  address,
                  signature.signature,
                  signature.slot
                );
              }
            }
          }
        }
      } catch (error) {
        console.log("循環發生錯誤: ", error);
      }
    }, 5000);
  }
  /**
   *
   * @param {string} chat_id
   */
  // 不存在就幫他初始化
  initialization(chat_id) {
    if (!this.states.has(chat_id)) {
      this.states.set(chat_id, new State());
    }
  }
  /**
   *
   * @param {string} chat_id
   */
  // 設置加入錢包
  solAddWallet(chat_id) {
    this.states.get(chat_id).setSolAddWallet(true);
  }
  /**
   *
   * @param {string} chat_id
   */
  // 設置加入錢包
  solDeleteWallet(chat_id) {
    this.states.get(chat_id).setSolDeleteWallet(true);
  }
  /**
   *
   * @param {string} chat_id
   * @param {string} message
   * @returns
   */
  // 每次接收到的訊息會看該群組是否有正在使用指令
  setSolWallet(chat_id, message) {
    // 檢查增加 sol 地址
    if (this.states.get(chat_id).getAddSolWallet()) {
      let wallet_address, name;
      let parts = message.split(" ");

      this.states.get(chat_id).setSolAddWallet(false);
      if (parts.length != 2) {
        this.bot.sendMessage(chat_id, `<b>公主請好好輸入</b>`, {
          parse_mode: "HTML",
        });
        return;
      }

      wallet_address = parts[0];
      name = parts[1];

      if (!this.sol_wallet.isSol(wallet_address)) {
        this.bot.sendMessage(chat_id, `${wallet_address} 這不是 sol 地址`);
        return;
      }
      this.states.get(chat_id).setSolWalletMap(wallet_address, name);
      this.saveJson();
    }

    if (this.states.get(chat_id).getDeleteSolWallet()) {
      this.states.get(chat_id).setSolDeleteWallet(false);
      this.states.get(chat_id).deleteSolWalletMap(message);
      this.saveJson();
    }
  }
  // 看看有沒有人設定資料
  setChatStates(chat_id, message) {
    this.setSolWallet(chat_id, message);
  }

  /**
   *
   * @param {number} chat_id
   * @returns {Map<string, string>}
   */
  getSolWalletMap(chat_id) {
    return this.states.get(chat_id).getSolWalletMap();
  }
}

module.exports = ChatStates;
