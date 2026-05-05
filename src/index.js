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
const helpCmd      = require('./commands/user/help');

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
helpCmd(bot);

// Register admin commands
addCharCmd(bot);
listCharCmd(bot);
giveCmd(bot);
banCmd(bot);

// Handle claim button callback
bot.action(/^claim_(.+)$/, claimCmd(activePulls));

// Handle action buttons - actually execute commands
bot.action('action_pull', async (ctx) => {
  ctx.answerCbQuery();
  // Simulate /pull command
  const { rollCharacter, attemptClaim } = require('./services/gachaService');
  const User = require('./models/User');
  const { getOrCreateUser } = require('./services/userService');
  
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(ctx);
  
  if (user.isBanned) return ctx.reply('🚫 You are banned.');
  if (activePulls[userId]) return ctx.reply('⚠️ You already have an active pull. Use /exit to cancel.');

  const now = Date.now();
  if (user.cooldowns.pull > now) {
    const sec = Math.ceil((user.cooldowns.pull - now) / 1000);
    return ctx.reply(`⏳ Cooldown! Wait ${sec}s before pulling again.`);
  }

  if (user.coins < 10) {
    return ctx.reply(`💸 Not enough coins! You need 10 coins to pull.`);
  }

  const char = await rollCharacter();
  if (!char) return ctx.reply('❌ No characters in the pool yet.');

  user.coins -= 10;
  await user.save();

  const WINDOW_MS = 60000;
  const timeoutId = setTimeout(() => {
    delete activePulls[userId];
  }, WINDOW_MS);

  activePulls[userId] = { characterId: String(char._id), expiresAt: now + WINDOW_MS, timeoutId };

  const rarityEmoji = { common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟡' };
  await ctx.reply(
    `${rarityEmoji[char.rarity] || '⚪'} A wild character appears!\n\n` +
    `✨ **${char.name}** [${char.rarity.toUpperCase()}]\n` +
    `⚔️ ATK: ${char.attack} | 🛡️ DEF: ${char.defense}\n\n` +
    `Tap Claim before it disappears! (60s)`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '🎴 Claim', callback_data: `claim_${userId}` }]]
      }
    }
  );

  if (char.imageUrl) {
    ctx.replyWithPhoto(char.imageUrl, {
      caption: `**${char.name}** — ${char.rarity.toUpperCase()}`,
      parse_mode: 'Markdown'
    }).catch(() => {});
  }
});

bot.action('action_inventory', async (ctx) => {
  ctx.answerCbQuery();
  const { getOrCreateUser } = require('./services/userService');
  const { getUserInventory } = require('./services/inventoryService');
  
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(ctx);
  const inventory = await getUserInventory(userId);

  if (!inventory.length) {
    return ctx.reply('📦 Your collection is empty. Pull some characters!');
  }

  const rarityEmoji = { common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟡' };
  let message = `📦 Your Collection (${inventory.length} characters)\n\n`;

  inventory.forEach(char => {
    const emoji = rarityEmoji[char.rarity] || '⚪';
    message += `${emoji} **${char.name}** — ${char.rarity.toUpperCase()}\n`;
    message += `⚔️ ${char.attack} | 🛡️ ${char.defense}\n`;
    if (char.imageUrl) message += `🖼️ Has image\n`;
    message += '\n';
  });

  ctx.reply(message, { parse_mode: 'Markdown' });

  const photosToSend = inventory.filter(c => c.imageUrl).slice(0, 5);
  for (const char of photosToSend) {
    ctx.replyWithPhoto(char.imageUrl, {
      caption: `**${char.name}**`,
      parse_mode: 'Markdown'
    }).catch(() => {});
  }
});

bot.action('action_help', (ctx) => {
  ctx.answerCbQuery();
  const message = 
    `📚 **GACHA BOT COMMANDS**\n\n` +
    `🎮 **User**\n` +
    `/pull - Pull a character (10 coins)\n` +
    `/inventory - View your collection\n` +
    `/start - Back to home\n\n` +
    `👑 **Admin**\n` +
    `/addchar - Add character\n` +
    `/listchar - List all\n` +
    `/give - Give coins\n` +
    `/ban - Ban user\n\n` +
    `ℹ️ **Rates**\n` +
    `⚪ Common: 60%\n` +
    `🔵 Rare: 25%\n` +
    `🟣 Epic: 10%\n` +
    `🟡 Legendary: 5%\n\n` +
    `🎴 Claim: 80% success`;

  ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🏠 Back Home', callback_data: 'action_home' }]
      ]
    }
  });
});

bot.action('action_info', (ctx) => {
  ctx.answerCbQuery();
  const message = 
    `ℹ️ **BOT INFORMATION**\n\n` +
    `🎯 **Goal**\n` +
    `Collect your favorite waifus and characters!\n\n` +
    `💰 **Economy**\n` +
    `Start with: 100 coins\n` +
    `Pull cost: 10 coins\n` +
    `Max pulls: 10 pulls\n\n` +
    `🎲 **Mechanics**\n` +
    `Pull & Claim: 80% success\n` +
    `Cooldown: 60 seconds\n` +
    `Claim window: 60 seconds\n\n` +
    `🔧 **Features**\n` +
    `✅ Character collection\n` +
    `✅ Image support\n` +
    `✅ Admin controls\n` +
    `✅ Ban system`;

  ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🏠 Back Home', callback_data: 'action_home' }]
      ]
    }
  });
});

bot.action('action_home', async (ctx) => {
  ctx.answerCbQuery();
  const { getOrCreateUser } = require('./services/userService');
  const user = await getOrCreateUser(ctx);
  const message = 
    `🎮 **GACHA BOT**\n\n` +
    `👤 **Your Profile**\n` +
    `💰 Coins: **${user.coins}**\n` +
    `📦 Characters: **${user.inventory.length}**\n\n` +
    `🎯 **Features**\n` +
    `🎴 Collect rare waifus and characters\n` +
    `💎 Build your own anime harem\n` +
    `🎲 80% claim success rate\n\n` +
    `⚡ Tap a button below to start!`;

  ctx.editMessageText(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🎴 PULL NOW', callback_data: 'action_pull' },
          { text: '📦 INVENTORY', callback_data: 'action_inventory' }
        ],
        [
          { text: '❓ HELP', callback_data: 'action_help' },
          { text: '💡 INFO', callback_data: 'action_info' }
        ]
      ]
    }
  }).catch(() => {});
});

// Ping command for testing
bot.command('ping', (ctx) => ctx.reply('🏓 Pong!'));

bot.launch();
console.log('✅ Bot is running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
