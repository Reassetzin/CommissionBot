require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID || null,
  guildId: process.env.GUILD_ID || null, // optional, for instant slash command registration during dev

  // Channel the panel embed lives in. Bot checks this channel's pins on every
  // startup and posts/pins the panel automatically if it's not already there.
  commissionsChannelId: process.env.COMMISSIONS_CHANNEL_ID || null,

  staffRoleId: process.env.STAFF_ROLE_ID || null,
  notifyRoleId: process.env.NOTIFY_ROLE_ID || process.env.STAFF_ROLE_ID || null,
  commissionsCategoryId: process.env.COMMISSIONS_CATEGORY_ID || null,
  logChannelId: process.env.LOG_CHANNEL_ID || null,
  // Ledger for /revenue — defaults to the transcript log channel if not set separately.
  paymentLogChannelId: process.env.PAYMENT_LOG_CHANNEL_ID || process.env.LOG_CHANNEL_ID || null,
  reviewsChannelId: process.env.REVIEWS_CHANNEL_ID || null,
  staffRoleName: process.env.STAFF_ROLE_NAME || 'Studio Duo Team',
};
