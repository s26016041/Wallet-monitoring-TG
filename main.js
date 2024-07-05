const TelegramBot = require('node-telegram-bot-api');
const parameters = require('./src/parameter/parameter.js');
const avatar = require('./src/avatar/avatar.js');
const chatStates={}


const bot = new TelegramBot(parameters.botToken, { polling: true });
// 監聽 /start 命令
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '遇是狗');

  });
  // 監聽 /start 命令
bot.onText(/\/avatar/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '請輸入圖片連接替換頭像');
    chatStates[chatId].avatar=true
  });
  


  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
         // 初始化聊天狀態
  if (!chatStates[chatId]) {
    chatStates[chatId] = {
      avatar:false,
    };


  }
    if (chatStates[chatId].avatar){
            avatar(text,"acatar.jpg",chatId)
            chatStates[chatId].avatar=false
    }
  });