const { adminOnly } = require('../../middleware/auth');
const User = require('../../models/User');

module.exports = (bot) => {
  bot.command('give', adminOnly, async (ctx) => {
    try {
      const args = ctx.message.text.replace('/give', '').trim().split(/\s+/);
      
      if (args.length < 2) {
        return ctx.reply('❌ Usage: `/give <userId> <amount>`\n\nExample: `/give 123456789 100`', { parse_mode: 'Markdown' });
      }

      const [userId, amount] = args;
      if (isNaN(amount) || parseInt(amount) <= 0) {
        return ctx.reply('❌ Amount must be a positive number.');
      }

      const user = await User.findOne({ userId });
      if (!user) {
        return ctx.reply('❌ User not found.');
      }

      user.coins += parseInt(amount);
      await user.save();

      ctx.reply(
        `✅ Gave **${amount}** coins to user ${userId}\n\n` +
        `💰 New balance: **${user.coins}** coins`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      console.error('Give error:', err);
      ctx.reply('❌ Error giving coins.');
    }
  });
};
