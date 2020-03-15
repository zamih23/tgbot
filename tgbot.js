const token = '894556919:AAHeZvhwnjQDQRqWnAosvC8ferZ6Ua1dMZU';

const Telegraf = require('telegraf')

const bot = new Telegraf('894556919:AAHeZvhwnjQDQRqWnAosvC8ferZ6Ua1dMZU');
bot.start((ctx) => ctx.reply('галера нуждается в тебе'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.launch()
