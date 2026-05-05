const { attemptClaim } = require('../../services/gachaService');
const User = require('../../models/User');
const Character = require('../../models/Character');

module.exports = (activePulls) => {
  return async (ctx) => {
    try {
      const userId = String(ctx.from.id);
      const activePull = activePulls[userId];

      if (!activePull) {
        return ctx.answerCbQuery('❌ No active pull for you.');
      }

      const now = Date.now();
      if (activePull.expiresAt < now) {
        delete activePulls[userId];
        return ctx.answerCbQuery('⏰ Pull expired!');
      }

      const character = await Character.findById(activePull.characterId);
      if (!character) {
        delete activePulls[userId];
        return ctx.answerCbQuery('❌ Character not found.');
      }

      const user = await User.findOne({ userId });
      if (!user) {
        delete activePulls[userId];
        return ctx.answerCbQuery('❌ User not found.');
      }

      // Attempt claim (80% success rate)
      if (attemptClaim()) {
        // Success: add to inventory
        user.inventory.push({ characterId: activePull.characterId });
        await user.save();
        
        clearTimeout(activePull.timeoutId);
        delete activePulls[userId];
        
        ctx.answerCbQuery(`✅ You got **${character.name}**!`);
        return ctx.editMessageText(
          `✅ You got **${character.name}** [${character.rarity.toUpperCase()}]!\n\n` +
          `⚔️ ATK: ${character.attack} | 🛡️ DEF: ${character.defense}`,
          { parse_mode: 'Markdown' }
        );
      } else {
        // Failure: character escapes
        clearTimeout(activePull.timeoutId);
        delete activePulls[userId];
        
        ctx.answerCbQuery('💨 It got away!');
        return ctx.editMessageText(
          `💨 **${character.name}** got away!\n\nBetter luck next time!`,
          { parse_mode: 'Markdown' }
        );
      }
    } catch (err) {
      console.error('Claim error:', err);
      ctx.answerCbQuery('❌ Error during claim.');
    }
  };
};
