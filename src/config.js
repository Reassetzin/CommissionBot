require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,

  // Channel the panel embed lives in. Bot checks this channel's pins on startup
  // and posts+pins the panel automatically if it isn't already there.
  commissionsChannelId: process.env.COMMISSIONS_CHANNEL_ID || null,

  staffRoleId: process.env.STAFF_ROLE_ID || null,
  notifyRoleId: process.env.NOTIFY_ROLE_ID || process.env.STAFF_ROLE_ID || null,
  commissionsCategoryId: process.env.COMMISSIONS_CATEGORY_ID || null,
  logChannelId: process.env.LOG_CHANNEL_ID || null,
  staffRoleName: process.env.STAFF_ROLE_NAME || 'Studio Duo Team',
};
