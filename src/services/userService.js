const User = require('../models/User');

// Fetch user or create if new
const getOrCreateUser = async (ctx) => {
  const { id, username } = ctx.from;
  let user = await User.findOne({ userId: String(id) });
  if (!user) {
    user = await User.create({ userId: String(id), username });
  }
  return user;
};

module.exports = { getOrCreateUser };
