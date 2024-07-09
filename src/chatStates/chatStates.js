const SolWallet = require("../solwallet/solwallet.js");
const parameters = require("../parameter/parameter.js");
const axios = require("axios");
class ChatStates {
  constructor(bot) {
    this.states = new Map();
    this.sol_wallet = new SolWallet(parameters.SOLRPC);
    this.bot = bot;
    // this.sol_usd = this.getSolPrice().data.solana.usd;
    this.start();
    this.getSolPrice();
  }

  /**
   * 
   * @param {number} num 
   * @param {number} decimals 
   * @returns {number}
   */
  formatNumber(num, decimals) {
    if (Number.isInteger(num)) {
      return num.toString(); // 如果是整数，直接返回字符串形式的整数
    } else {
      return num.toFixed(decimals); // 如果是小数，返回指定位数的小数
    }
  }
  async getSolPrice() {
    let response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    );
    this.sol_usd = response.data.solana.usd
  }
  start() {
    this.solPriceUsd = setInterval(async () => {
      this.getSolPrice();
    }, 600000);
    this.printFiveInterval = setInterval(async () => {
      // SOL 價格

      for (let [chat_id, data] of this.states) {
        let state_obj = this.states.get(chat_id);
        // console.log(this.states);
        // console.log(this.sol_usd);
        if (data && data.sol_wallet_map && data.sol_wallet_map.size > 0) {
          for (let [address, name] of data.sol_wallet_map.entries()) {
            let SignatureArray = await this.sol_wallet.getSignatureArray(
              address
            );
            if (SignatureArray.length ==0){continue}
            // console.log(address)
            // 沒有最後一筆哈希的話幫她添加
            if (!data.address_signature.has(address)) {
              if (state_obj) {
                // 修改状态对象中的 address_signature 改為最新簽名
                state_obj.address_signature.set(
                  address,
                  SignatureArray[0].signature
                );
                // console.log(SignatureArray)
                // 将更新后的状态对象重新存回 Map 中
                this.states.set(chat_id, state_obj);
              }
              continue;
            }
            // 把新的哈希交易都通知
            for (let signature of SignatureArray) {
              if (signature.signature == state_obj.address_signature.get(address)) {
                break;
              }
              let transaction = await this.sol_wallet.getTransaction(signature.signature);
              // 一些特殊交易室會回傳未定義
              if (
                !transaction || !transaction.meta.postTokenBalances || transaction.meta.postTokenBalances.length === 0 ||
                !transaction.meta.preTokenBalances || transaction.meta.preTokenBalances.length === 0
              ) {
                continue;
              }

              if (transaction.meta.preTokenBalances) {
                let solscan_wallet_url = `https://solscan.io/account/${address}`;
                let telegram_message = ``;
                let post_sol = transaction.meta.postBalances;
                let post_token = transaction.meta.postTokenBalances;
                let pre_sol = transaction.meta.preBalances;
                let pre_token = transaction.meta.preTokenBalances;
                let token_address, token_name, accountIndex, lamports, photon_url, solscan_token_url, price,signature_url
                let token_number = 0
                let sol_number = 0


                telegram_message += `[<a href="${solscan_wallet_url}">${name}</a>]\n`
                for (let pre_token_data of pre_token) {
                  if (pre_token_data.owner === address) {
                    token_address = pre_token_data.mint
                    if (!pre_token_data.uiTokenAmount.uiAmount == null) {
                      token_number += pre_token_data.uiTokenAmount.uiAmount
                    }
                    accountIndex = pre_token_data.accountIndex - 1
                  }
                }
                for (let post_token_data of post_token) {
                  if (post_token_data.owner === address) {
                    token_address = post_token_data.mint
                    if (!post_token_data.uiTokenAmount.uiAmount == null) {
                      token_number -= post_token_data.uiTokenAmount.uiAmount
                    }
                    accountIndex = post_token_data.accountIndex - 1
                  }
                }
                solscan_token_url = `https://solscan.io/token/${token_address}`
                token_name = await this.sol_wallet.getTokenName(token_address);
                lamports = pre_sol[accountIndex] - post_sol[accountIndex]
                sol_number = this.sol_wallet.lamportToSol(Math.abs(lamports))
                price = sol_number / Math.abs(token_number)
                photon_url = `https://photon-sol.tinyastro.io/zh/lp/${token_address}`
                signature_url =`https://solscan.io/tx/${signature}`
                if (token_number < 0) {
                  telegram_message += `<b>🔴 賣 ${sol_number} SOL</b>\n`;
                  telegram_message += `<b>🟢 買 ${Math.abs(token_number)} [<a href="${solscan_token_url}">${token_name}</a>]</b>\n`;
                  telegram_message += `價格: ${price}\n`;
                  telegram_message += `<a href="${photon_url}">photon</a>\n`;
                  telegram_message += `代幣地址: <code>${token_address}</code>\n`;
                  telegram_message += `<a href="${signature_url}">交易情況</a>\n`;
                } else {
                  telegram_message += `<b>🔴 賣 ${Math.abs(token_number)} [<a href="${solscan_token_url}">${token_name}</a>]</b>\n`;
                  telegram_message += `<b>🟢 買 ${sol_number} SOL</b>\n`;
                  telegram_message += `價格: ${price}\n`;
                  telegram_message += `<a href="${photon_url}">photon</a>\n`;
                  telegram_message += `代幣地址: <code>${token_address}</code>\n`;
                  telegram_message += `<a href="${signature_url}">交易情況</a>\n`;
                }

                this.bot.sendMessage(chat_id, telegram_message, {
                  parse_mode: "HTML",
                });


              }
            }
            // 換成最新的哈希
            if (state_obj) {
              // 修改状态对象中的 address_signature 改為最新簽名
              state_obj.address_signature.set(
                address,
                SignatureArray[0].signature
              );
              // 将更新后的状态对象重新存回 Map 中
              this.states.set(chat_id, state_obj);
            }
          }
        }
      }
    }, 5000);
  }

  // 不存在就幫他初始化
  initialization(chat_id) {
    if (!this.states.has(chat_id)) {
      this.states.set(chat_id, {
        sol_wallet_map: new Map(),
        add_wallet: false,
        address_signature: new Map(),
      });
    }
  }
  get_sol_wallet_map(chat_id) {
    return this.states.get(chat_id).sol_wallet_map;
  }
  // 設置加入錢包
  addWallet(chat_id) {
    let state_obj = this.states.get(chat_id);
    if (state_obj) {
      // 修改状态对象中的 add_wallet 属性为 true
      state_obj.add_wallet = true;
      // 将更新后的状态对象重新存回 Map 中
      this.states.set(chat_id, state_obj);
    }
  }
  // 每次接收到的訊息會看該群組是否有正在使用指令
  setSolWallet(chat_id, message) {

    if (this.states.get(chat_id).add_wallet) {
      let wallet_address, name;
      let parts = message.split(" ");
      let state_obj = this.states.get(chat_id);
      state_obj.add_wallet = false;

      if (parts.length != 2) {
        this.bot.sendMessage(chat_id, "草你媽別亂輸入");
        this.states.set(chat_id, state_obj);
        return;
      }
      wallet_address = parts[0];
      name = parts[1];

      if (!this.sol_wallet.isSol(wallet_address)) {
        this.bot.sendMessage(chat_id, `${wallet_address} 這不是 sol 地址`);
        this.states.set(chat_id, state_obj);
        return;
      }

      state_obj.sol_wallet_map.set(wallet_address, name);
      this.states.set(chat_id, state_obj);
    }
  }
  // 看看有沒有人設定資料
  setChatStates(chat_id, message) {
    this.setSolWallet(chat_id, message);
  }
}

module.exports = ChatStates;
