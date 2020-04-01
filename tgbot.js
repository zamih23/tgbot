const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const Telegraf = require('node-telegram-bot-api');
const token = '894556919:AAHeZvhwnjQDQRqWnAosvC8ferZ6Ua1dMZU';
const bot = new Telegraf(token, { polling: true });
let linkBank;
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = 'token.json';

fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  authorize(JSON.parse(content), listFiles);
});

function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
  );
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function listFiles(auth) {
  const drive = google.drive({ version: 'v3', auth });
  drive.files.list(
      {
        q: "'1-3WVWlc7raSexxhOCu_8mNylTVt1cB6s' in parents",
        pageSize: 1000,
        fields: 'nextPageToken, files(id)',
      },
      (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const files = res.data.files;
        linkBank = res.data.files;
        if (files.length) {
          console.log(files.length + ' files found');
        } else {
          console.log('No files found.');
        }
      }
  );
}

function getRandom(min, max) {
  let rand = min - 0.5 + Math.random() * (max - min + 1);
  return Math.round(rand);
}

function searchId(target, arr) {
  for (let i = 0; i < arr.length; i++) {
    if (target == arr[i]['uid']) {
      return i;
    } else console.log('id not found');
  }
}

function copy(arr) {
  let newArr = [];
  for (let i = 0; i < arr.length; i++) {
    newArr[i] = arr[i];
  }
  return newArr;
}

let userDataBase = []; //arr with all chatId and arr with links
let index;

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  let oneUserBank = copy(linkBank); //arr for everyone user
  bot.sendMessage(
      chatId,
      'Hi, ' +
      msg.chat.first_name +
      '. I`m BadHumorBot. Welcome! What do you want?',
      {
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [{ text: 'Tap&Get', callback_data: '4' }],
            [{ text: 'Send me memes regulary', callback_data: '5' }],
            [{ text: 'I want money', callback_data: '6' }],
          ],
        }),
      }
  );
  userDataBase.push({
    uid: chatId,
    firstTime: '16:44',
    secondTime: '16:45',
    thirdTime: '16:46',
    fourthTime: '16:47',
    bank: oneUserBank,
    regularySending: false,
  });
  console.log(chatId + ' --- joined');
});

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  index = searchId(chatId, userDataBase);
  if (query.data === '4') {
    let rand = getRandom(0, userDataBase[index]['bank'].length); // tap to get photo
    bot.sendPhoto(
        userDataBase[index]['uid'],
        'https://drive.google.com/uc?export=view&id=' +
        userDataBase[index]['bank'][rand]['id'],
        {
          //link to photo
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [{ text: 'Get one more', callback_data: '4' }],
              [{ text: 'Send me memes regulary', callback_data: '5' }],
            ],
          }),
        }
    );
    userDataBase[index]['bank'].splice(rand, 1);
  } else if (query.data === '5') {
    //regulary sending photos
    userDataBase[index]['regularySending'] = true;
    bot.sendMessage(chatId, 'Ok, I`ll send you some memes a day'); //link to photo then splice it
  } else if (query.data === '6') {
    bot.sendMessage(chatId, 'Tap on "Send me memes" and fuck off');
  }
});

setInterval(() => {
  for (let i = 0; i < userDataBase.length; i++) {
    let rand = getRandom(0, userDataBase[i]['bank'].length);
    const curDate = new Date().getHours() + ':' + new Date().getMinutes();
    if (
        (userDataBase[i]['firstTime'] ||
            userDataBase[i]['secondTime'] ||
            userDataBase[i]['thirdTime'] ||
            userDataBase[i]['fourthTime'] === curDate) &&
        userDataBase[i]['regularySending'] == true
    ) {
      bot
          .sendPhoto(
              userDataBase[i]['uid'],
              'https://drive.google.com/uc?export=view&id=' +
              userDataBase[i]['bank'][rand]['id']
          )
          .catch(function(error) {
            if (error.response && error.response.statusCode === 403) {
              console.log(userDataBase[i]['uid'] + ' leave the chat');
              userDataBase.splice(i, 1);
            }
          });
      userDataBase[i]['bank'].splice(rand, 1); //maybe + some kind phraze
    } // splice from linkbank
  }
}, 60000);

bot.on('polling_error', (err) => console.log(err));
