require('dotenv').config();
const { Telegraf } = require('telegraf');
const connectDB = require('./config/db');
const bannedCheck = require('./middleware/bannedCheck');

// User Commands
const startCmd     = require('./commands/user/start');
const pullCmd      = require('./commands/user/pull');
const inventoryCmd = require('./commands/user/inventory');
const exitCmd      = require('./commands/user/exit');
const claimCmd     = require('./commands/user/claim');

// Admin Commands
const addCharCmd   = require('./commands/admin/addChar');
const listCharCmd  = require('./commands/admin/listChar');
const giveCmd      = require('./commands/admin/give');
const banCmd       = require('./commands/admin/ban');

const activePulls = {};  // shared state for active pulls

connectDB();

const bot = new Telegraf(process.env.BOT_TOKEN);

// Global middleware
bot.use(bannedCheck);

// Register user commands
startCmd(bot);
pullCmd(bot, activePulls);
inventoryCmd(bot);
exitCmd(bot, activePulls);

// Register admin commands
addCharCmd(bot);
listCharCmd(bot);
giveCmd(bot);
banCmd(bot);

// Handle claim button callback
bot.action(/^claim_(.+)$/, claimCmd(activePulls));

// Ping command for testing
bot.command('ping', (ctx) => ctx.reply('🏓 Pong!'));

bot.launch();
console.log('✅ Bot is running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
