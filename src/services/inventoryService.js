const User = require('../models/User');
const Character = require('../models/Character');

const getUserInventory = async (userId) => {
  const user = await User.findOne({ userId });
  if (!user || !user.inventory.length) return [];

  const ids = user.inventory.map(i => i.characterId);
  const chars = await Character.find({ _id: { $in: ids } });

  return chars;
};

module.exports = { getUserInventory };
