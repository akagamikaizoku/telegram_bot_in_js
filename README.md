# 🎮 Telegram Gacha Bot — Development Plan

> A scalable, phase-by-phase blueprint for building a Telegram gacha character bot with MongoDB, risk-based pulls, admin controls, and a clean modular architecture.

---

## 📁 Final Project Structure

```
telegram-gacha-bot/
│
├── src/
│   ├── index.js                  ← Bot entry point
│   ├── config/
│   │   └── db.js                 ← MongoDB connection
│   │
│   ├── models/
│   │   ├── User.js               ← User schema (coins, inventory, cooldowns)
│   │   └── Character.js          ← Character schema (name, rarity, stats)
│   │
│   ├── services/
│   │   ├── gachaService.js       ← Rarity roll logic
│   │   ├── userService.js        ← User fetch/create helpers
│   │   └── inventoryService.js   ← Add/view inventory
│   │
│   ├── commands/
│   │   ├── user/
│   │   │   ├── start.js          ← /start
│   │   │   ├── pull.js           ← /pull (core mechanic)
│   │   │   ├── claim.js          ← inline button handler
│   │   │   ├── exit.js           ← /exit (cancel active pull)
│   │   │   └── inventory.js      ← /inventory
│   │   │
│   │   └── admin/
│   │       ├── addChar.js        ← /addchar
│   │       ├── listChar.js       ← /listchar
│   │       ├── removeChar.js     ← /removechar
│   │       ├── give.js           ← /give (coins)
│   │       └── ban.js            ← /ban
│   │
│   ├── middleware/
│   │   ├── auth.js               ← Admin check middleware
│   │   └── bannedCheck.js        ← Banned user check
│   │
│   └── utils/
│       ├── validator.js          ← Input validation helpers
│       └── random.js             ← Weighted random picker
│
├── .env                          ← Secrets (never commit)
├── .env.example                  ← Template for others
├── .gitignore
└── package.json
```

---

## ⚙️ Environment Variables

Create a `.env` file in root:

```env
BOT_TOKEN=your_telegram_bot_token_here
ADMIN_IDS=123456789,987654321
MONGO_URI=mongodb://localhost:27017/gacha-bot

# Pull settings
PULL_COOLDOWN_SECONDS=60
PULL_CLAIM_WINDOW_SECONDS=60
PULL_SUCCESS_RATE=0.8
```

> Get `BOT_TOKEN` from [@BotFather](https://t.me/BotFather) on Telegram.
> `ADMIN_IDS` is a comma-separated list of Telegram user IDs who have admin access.

---

## 📦 Dependencies

```bash
npm install telegraf dotenv mongoose
npm install --save-dev nodemon
```

| Package    | Purpose                        |
|------------|--------------------------------|
| `telegraf` | Telegram Bot framework         |
| `dotenv`   | Load `.env` variables          |
| `mongoose` | MongoDB ODM                    |
| `nodemon`  | Auto-restart during development|

Add to `package.json` scripts:

```json
"scripts": {
  "start": "node src/index.js",
  "dev": "nodemon src/index.js"
}
```

---

---

## 🚀 Phase 1 — Basic Bot Setup

**Goal:** Bot is online and responds to `/start` and `/ping`.

### Steps

1. Create bot via [@BotFather](https://t.me/BotFather) → `/newbot` → copy the token into `.env`
2. Create `src/index.js`:

```js
require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply('👋 Welcome to Gacha Bot!'));
bot.command('ping', (ctx) => ctx.reply('🏓 Pong!'));

bot.launch();
console.log('Bot is running...');
```

3. Run: `npm run dev`
4. Open Telegram → message your bot `/start`

✅ **Done when:** Bot replies to `/start` and `/ping`

---

## 🗄️ Phase 2 — MongoDB Connection

**Goal:** Bot connects to MongoDB on startup.

### `src/config/db.js`

```js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### Update `src/index.js`

```js
require('dotenv').config();
const { Telegraf } = require('telegraf');
const connectDB = require('./config/db');

connectDB();

const bot = new Telegraf(process.env.BOT_TOKEN);
// ... commands
bot.launch();
```

✅ **Done when:** Terminal prints `✅ MongoDB connected` on startup

---

## 👤 Phase 3 — User Model

**Goal:** Store users with coins, inventory, cooldowns, and ban status.

### `src/models/User.js`

```js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId:    { type: String, required: true, unique: true },
  username:  { type: String, default: 'Unknown' },
  coins:     { type: Number, default: 100 },          // start with 100 coins
  isBanned:  { type: Boolean, default: false },
  inventory: [
    {
      characterId: { type: String, required: true },
      obtainedAt:  { type: Date, default: Date.now }
    }
  ],
  cooldowns: {
    pull: { type: Number, default: 0 }                // Unix timestamp ms
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
```

### `src/services/userService.js`

```js
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
```

✅ **Done when:** New users are auto-created in MongoDB on first interaction

---

## 🧬 Phase 4 — Character Model

**Goal:** Store characters with name, rarity, and stats.

### `src/models/Character.js`

```js
const mongoose = require('mongoose');

const RARITIES = ['common', 'rare', 'epic', 'legendary'];

const characterSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  rarity:  { type: String, enum: RARITIES, required: true },
  attack:  { type: Number, required: true, min: 0 },
  defense: { type: Number, required: true, min: 0 },
  imageUrl:{ type: String, default: null },          // optional art URL
  addedBy: { type: String },                         // admin userId who added it
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Character', characterSchema);
```

✅ **Done when:** Characters can be inserted into the DB manually or via admin command (Phase 7)

---

## 🎲 Phase 5 — Gacha Service (Rarity + Pull Logic)

**Goal:** Implement weighted rarity rolls and the 80/20 claim mechanic.

### Rarity Rates

| Rarity    | Chance |
|-----------|--------|
| Common    | 60%    |
| Rare      | 25%    |
| Epic      | 10%    |
| Legendary | 5%     |

### `src/utils/random.js`

```js
// Weighted random pick
const weightedRandom = (items) => {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let rand = Math.random() * total;
  for (const item of items) {
    rand -= item.weight;
    if (rand <= 0) return item.value;
  }
  return items[items.length - 1].value;
};

module.exports = { weightedRandom };
```

### `src/services/gachaService.js`

```js
const Character = require('../models/Character');
const { weightedRandom } = require('../utils/random');

const RARITY_WEIGHTS = [
  { value: 'common',    weight: 60 },
  { value: 'rare',      weight: 25 },
  { value: 'epic',      weight: 10 },
  { value: 'legendary', weight: 5  },
];

// Roll a rarity then pick a random character of that rarity
const rollCharacter = async () => {
  const rarity = weightedRandom(RARITY_WEIGHTS);
  const characters = await Character.find({ rarity });
  if (!characters.length) return null;
  return characters[Math.floor(Math.random() * characters.length)];
};

// 80% success, 20% fail on claim
const attemptClaim = () => Math.random() < parseFloat(process.env.PULL_SUCCESS_RATE || 0.8);

module.exports = { rollCharacter, attemptClaim };
```

✅ **Done when:** `rollCharacter()` returns a valid character object from the DB

---

## 🎮 Phase 6 — Pull System (`/pull`, `/exit`, Claim Button)

**Goal:** Core gacha loop — pull a character, show claim button, 80/20 chance on claim.

### Active Pull Store (in-memory, `src/index.js` or a module)

```js
const activePulls = {};  // { userId: { characterId, expiresAt, timeoutId } }
```

### Pull Flow

```
/pull
  → check if user is banned
  → check cooldown (from user.cooldowns.pull)
  → check no active pull already pending
  → rollCharacter()
  → store in activePulls[userId] with 60s expiry timer
  → send message with character preview + [🎴 Claim] button
```

### Claim Flow (inline button callback)

```
User taps [🎴 Claim]
  → check activePulls[userId] exists and not expired
  → attemptClaim()
    → SUCCESS (80%): add char to inventory, save user, reply "✅ You got [Name]!"
    → FAIL (20%):    character escapes, reply "💨 It got away!"
  → clear activePulls[userId]
  → set user.cooldowns.pull = Date.now() + COOLDOWN_MS
```

### `/exit` Flow

```
/exit
  → if activePulls[userId] exists: cancel timeout, delete entry, reply "Pull cancelled."
  → else: reply "No active pull."
```

### `src/commands/user/pull.js` (structure)

```js
const { rollCharacter } = require('../../services/gachaService');
const { getOrCreateUser } = require('../../services/userService');
const COOLDOWN_MS = (parseInt(process.env.PULL_COOLDOWN_SECONDS) || 60) * 1000;
const WINDOW_MS   = (parseInt(process.env.PULL_CLAIM_WINDOW_SECONDS) || 60) * 1000;

module.exports = (bot, activePulls) => {
  bot.command('pull', async (ctx) => {
    const userId = String(ctx.from.id);
    const user = await getOrCreateUser(ctx);

    if (user.isBanned) return ctx.reply('🚫 You are banned.');

    const now = Date.now();
    if (user.cooldowns.pull > now) {
      const sec = Math.ceil((user.cooldowns.pull - now) / 1000);
      return ctx.reply(`⏳ Cooldown! Wait ${sec}s before pulling again.`);
    }

    if (activePulls[userId]) return ctx.reply('⚠️ You already have an active pull. Use /exit to cancel.');

    const char = await rollCharacter();
    if (!char) return ctx.reply('❌ No characters in the pool yet. Ask an admin to add some!');

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
  });
};
```

✅ **Done when:** `/pull` shows a character card with a working Claim button

---

## 📦 Phase 7 — Inventory System

**Goal:** Users can view their collected characters.

### `src/services/inventoryService.js`

```js
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
```

### `/inventory` output format

```
📦 Your Collection (12 characters)

🟡 Naruto — Legendary  ⚔️100 🛡️80
🟣 Sasuke — Epic       ⚔️85  🛡️70
🔵 Kakashi — Rare      ⚔️70  🛡️65
⚪ Sakura — Common     ⚔️40  🛡️50
...
```

> Tip: paginate with inline buttons if collection grows large.

✅ **Done when:** `/inventory` lists all owned characters

---

## 🛡️ Phase 8 — Middleware

**Goal:** Reusable checks used across multiple commands.

### `src/middleware/auth.js`

```js
const ADMIN_IDS = process.env.ADMIN_IDS.split(',').map(id => id.trim());

const isAdmin = (userId) => ADMIN_IDS.includes(String(userId));

const adminOnly = async (ctx, next) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('🔒 Admin only.');
  }
  return next();
};

module.exports = { isAdmin, adminOnly };
```

### `src/middleware/bannedCheck.js`

```js
const User = require('../models/User');

const bannedCheck = async (ctx, next) => {
  const user = await User.findOne({ userId: String(ctx.from.id) });
  if (user?.isBanned) return ctx.reply('🚫 You are banned from this bot.');
  return next();
};

module.exports = bannedCheck;
```

Apply globally in `index.js`:

```js
bot.use(bannedCheck);
```

---

## 👑 Phase 9 — Admin Commands

**Goal:** Admins can manage characters and users.

### `/addchar <name> <rarity> <attack> <defense>`

```
/addchar Naruto legendary 100 80
```

Validation rules:
- Name must not be empty
- Rarity must be one of: `common`, `rare`, `epic`, `legendary`
- Attack and defense must be positive integers

### `src/utils/validator.js`

```js
const VALID_RARITIES = ['common', 'rare', 'epic', 'legendary'];

const validateCharInput = (args) => {
  const [name, rarity, attack, defense] = args;
  const errors = [];

  if (!name) errors.push('Name is required.');
  if (!VALID_RARITIES.includes(rarity)) errors.push(`Rarity must be one of: ${VALID_RARITIES.join(', ')}`);
  if (isNaN(attack) || parseInt(attack) < 0)  errors.push('Attack must be a positive number.');
  if (isNaN(defense) || parseInt(defense) < 0) errors.push('Defense must be a positive number.');

  return errors;
};

module.exports = { validateCharInput };
```

### All Admin Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `/addchar` | `/addchar Naruto legendary 100 80` | Add a character to the pool |
| `/listchar` | `/listchar` | List all characters in the pool |
| `/removechar` | `/removechar <name>` | Delete a character by name |
| `/give` | `/give <userId> <amount>` | Give coins to a user |
| `/ban` | `/ban <userId>` | Ban a user from using the bot |
| `/unban` | `/unban <userId>` | Unban a user |

✅ **Done when:** Admin can add a char and it shows up in `/pull` results

---

## 💰 Phase 10 — Economy System

**Goal:** Coin-based economy for future features (optional now, scaffold only).

### Design

- All users start with **100 coins**
- Each pull costs **10 coins** (configurable)
- Coins can be gifted by admins via `/give`
- Future: earn coins from daily rewards, battles, etc.

### Add pull cost to pull.js

```js
const PULL_COST = 10;

if (user.coins < PULL_COST) {
  return ctx.reply(`💸 Not enough coins! You need ${PULL_COST} coins to pull.`);
}

// Deduct before rolling
user.coins -= PULL_COST;
await user.save();
```

✅ **Done when:** Pull deducts coins, `/give` adds them

---

## 🔁 Phase 11 — Wiring Everything in `index.js`

```js
require('dotenv').config();
const { Telegraf } = require('telegraf');
const connectDB = require('./config/db');
const bannedCheck = require('./middleware/bannedCheck');

// Commands
const startCmd     = require('./commands/user/start');
const pullCmd      = require('./commands/user/pull');
const inventoryCmd = require('./commands/user/inventory');
const exitCmd      = require('./commands/user/exit');
const addCharCmd   = require('./commands/admin/addChar');
const listCharCmd  = require('./commands/admin/listChar');
const giveCmd      = require('./commands/admin/give');
const banCmd       = require('./commands/admin/ban');

const activePulls = {};  // shared state for active pulls

connectDB();

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(bannedCheck);

startCmd(bot);
pullCmd(bot, activePulls);
inventoryCmd(bot);
exitCmd(bot, activePulls);
addCharCmd(bot);
listCharCmd(bot);
giveCmd(bot);
banCmd(bot);

// Handle claim button
bot.action(/^claim_(.+)$/, require('./commands/user/claim')(activePulls));

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
```

---

## 🧪 Testing Checklist (Per Phase)

After completing each phase, verify:

```
Phase 1  ✅ /start and /ping respond
Phase 2  ✅ "MongoDB connected" in terminal
Phase 3  ✅ New user auto-created in DB on /start
Phase 4  ✅ Character can be inserted into DB manually
Phase 5  ✅ rollCharacter() returns a character object
Phase 6  ✅ /pull shows character card + Claim button works
Phase 7  ✅ /inventory lists owned characters
Phase 8  ✅ Non-admin gets blocked on admin commands
Phase 9  ✅ /addchar adds character, appears in pull pool
Phase 10 ✅ Coins deducted on pull, /give adds coins
Phase 11 ✅ Full bot runs with all commands wired
```

---

## 🚀 Deployment (DigitalOcean VPS)

### 1. Install PM2

```bash
npm install -g pm2
```

### 2. Start Bot

```bash
pm2 start src/index.js --name gacha-bot
```

### 3. Auto-restart on Reboot

```bash
pm2 startup
pm2 save
```

### 4. Useful PM2 Commands

```bash
pm2 logs gacha-bot       # View live logs
pm2 restart gacha-bot    # Restart bot
pm2 stop gacha-bot       # Stop bot
pm2 status               # Check status
```

---

## ⚡ Future Features (Phase 12+)

| Feature | Description |
|---------|-------------|
| 🌍 Spawn System | Random characters drop in group chats for anyone to claim |
| 🔁 Trading | Users can trade characters with each other |
| ⚔️ Battles | Use ATK/DEF stats in PvP or PvE combat |
| 🏆 Leaderboard | Top collectors by rarity score |
| 📅 Daily Rewards | Claim free coins once per day |
| 🎉 Events | Limited-time legendary drops |
| 🏰 Guilds | Team up, share characters, guild wars |

---

## ⚠️ Hard Rules

- **Never skip validation** — always validate all input before touching the DB
- **Never skip cooldowns** — always check timestamps, not just session state
- **Never trust user IDs from message text** — always use `ctx.from.id`
- **Always use `String(userId)`** — Telegram IDs are numbers, MongoDB stores them as strings
- **Build one phase at a time** — test fully before moving to the next
- **Never commit `.env`** — add it to `.gitignore` immediately

---

*Built phase-by-phase. Test each one. Ship with confidence.* 🎮
