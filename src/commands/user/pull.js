const { rollCharacter, attemptClaim } = require('../../services/gachaService');
const { getOrCreateUser } = require('../../services/userService');
const User = require('../../models/User');

const COOLDOWN_MS = (parseInt(process.env.PULL_COOLDOWN_SECONDS) || 60) * 1000;
const WINDOW_MS   = (parseInt(process.env.PULL_CLAIM_WINDOW_SECONDS) || 60) * 1000;
const PULL_COST = 10;

module.exports = (bot, activePulls) => {
  bot.command('pull', async (ctx) => {
    try {
      const userId = String(ctx.from.id);
      const user = await getOrCreateUser(ctx);

      if (user.isBanned) return ctx.reply('🚫 You are banned.');

      if (activePulls[userId]) return ctx.reply('⚠️ You already have an active pull. Use /exit to cancel.');

      const now = Date.now();
      if (user.cooldowns.pull > now) {
        const sec = Math.ceil((user.cooldowns.pull - now) / 1000);
        return ctx.reply(`⏳ Cooldown! Wait ${sec}s before pulling again.`);
      }

      if (user.coins < PULL_COST) {
        return ctx.reply(`💸 Not enough coins! You need ${PULL_COST} coins to pull.`);
      }

      const char = await rollCharacter();
      if (!char) return ctx.reply('❌ No characters in the pool yet. Ask an admin to add some!');

      // Deduct coins before rolling
      user.coins -= PULL_COST;
      await user.save();

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

      // Send photo if available
      if (char.imageUrl) {
        ctx.replyWithPhoto(char.imageUrl, {
          caption: `**${char.name}** — ${char.rarity.toUpperCase()}`,
          parse_mode: 'Markdown'
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Pull error:', err);
      ctx.reply('❌ Error during pull. Try again.');
    }
  });
};
