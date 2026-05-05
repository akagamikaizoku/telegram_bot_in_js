const { adminOnly } = require('../../middleware/auth');
const User = require('../../models/User');

module.exports = (bot) => {
  // /ban command
  bot.command('ban', adminOnly, async (ctx) => {
    try {
      const args = ctx.message.text.replace('/ban', '').trim().split(/\s+/);
      
      if (!args[0]) {
        return ctx.reply('❌ Usage: `/ban <userId>`\n\nExample: `/ban 123456789`', { parse_mode: 'Markdown' });
      }

      const userId = args[0];
      let user = await User.findOne({ userId });

      if (!user) {
        user = await User.create({ userId, isBanned: true });
      } else {
        user.isBanned = true;
        await user.save();
      }

      ctx.reply(`🚫 User ${userId} has been **banned**.`, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('Ban error:', err);
      ctx.reply('❌ Error banning user.');
    }
  });

  // /unban command
  bot.command('unban', adminOnly, async (ctx) => {
    try {
      const args = ctx.message.text.replace('/unban', '').trim().split(/\s+/);
      
      if (!args[0]) {
        return ctx.reply('❌ Usage: `/unban <userId>`\n\nExample: `/unban 123456789`', { parse_mode: 'Markdown' });
      }

      const userId = args[0];
      const user = await User.findOne({ userId });

      if (!user) {
        return ctx.reply('❌ User not found.');
      }

      user.isBanned = false;
      await user.save();

      ctx.reply(`✅ User ${userId} has been **unbanned**.`, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('Unban error:', err);
      ctx.reply('❌ Error unbanning user.');
    }
  });
};
