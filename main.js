const TelegramBot = require("node-telegram-bot-api");
const parameters = require("./src/parameter/parameter.js");
const ChatStates = require("./src/chatStates/chatStates.js");

const bot = new TelegramBot(parameters.botToken, { polling: true });
const chat_states = new ChatStates(bot);
// 監聽 /start 命令
bot.onText(/\/start/, (msg) => {
  const chat_id = msg.chat.id;
  bot.sendMessage(
    chat_id,
    `<b>歡迎使用錢包追蹤目前只提供 SOL 地址追蹤</b>\n<code>/start</code> 介紹指令\n<code>/sol_add_wallet</code> 新增 SOL 追蹤地址\n<code>/sol_address_list</code> 查看 SOL 以追蹤地址\n<code>/sol_delete_wallet</code> 刪除 SOL 追蹤列表地址`,
    { parse_mode: "HTML" }
  );
});
bot.onText(/\/sol_address_list/, (msg) => {
  const chat_id = msg.chat.id;
  let wallet_message = `<b>你追蹤的錢包:</b> \n`;
  wallet_map = chat_states.getSolWalletMap(chat_id);
  wallet_map.forEach((key, value) => {
    wallet_message += ` [${key}]\n<code>${value}</code>\n`;
  });
  bot.sendMessage(chat_id, wallet_message, { parse_mode: "HTML" });
});

bot.onText(/\/sol_add_wallet/, (msg) => {
  const chat_id = msg.chat.id;
  bot.sendMessage(chat_id, "請輸入想追蹤的錢包和錢包名稱 範例: solxxxxxx 小明");
  chat_states.solAddWallet(chat_id);
});
bot.onText(/\/sol_delete_wallet/, (msg) => {
  const chat_id = msg.chat.id;
  let wallet_message = `<b>你追蹤的錢包:</b> \n`;
  wallet_map = chat_states.getSolWalletMap(chat_id);
  wallet_map.forEach((key, value) => {
    wallet_message += ` [${key}]\n<code>${value}</code>\n`;
  });
  bot.sendMessage(chat_id, wallet_message, { parse_mode: "HTML" });
  bot.sendMessage(chat_id, `<b>請輸入想刪除的地址:</b>`, {
    parse_mode: "HTML",
  });
  chat_states.solDeleteWallet(chat_id);
});
bot.on("message", (msg) => {
  const chat_id = msg.chat.id;
  const text = msg.text;
  chat_states.initialization(chat_id);
  if (msg.entities == undefined) {
    chat_states.setChatStates(chat_id, text);
  }
});
