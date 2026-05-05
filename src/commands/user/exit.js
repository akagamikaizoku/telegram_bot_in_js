module.exports = (bot, activePulls) => {
  bot.command('exit', async (ctx) => {
    const userId = String(ctx.from.id);
    
    if (activePulls[userId]) {
      clearTimeout(activePulls[userId].timeoutId);
      delete activePulls[userId];
      return ctx.reply('❌ Pull cancelled.');
    }
    
    ctx.reply('⚠️ No active pull.');
  });
};
