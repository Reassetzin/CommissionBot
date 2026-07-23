const { Client, GatewayIntentBits, Events, MessageFlags } = require('discord.js');
const config = require('./config');

const panel = require('./handlers/panel');
const { registerCommands } = require('./registerCommands');
const openCommission = require('./handlers/openCommission');
const selectService = require('./handlers/selectService');
const closeTicket = require('./handlers/closeTicket');
const tosAgree = require('./handlers/tosAgree');
const requestFeedback = require('./handlers/requestFeedback');
const leaveReview = require('./handlers/leaveReview');
const reviewStars = require('./handlers/reviewStars');
const submitReview = require('./handlers/submitReview');
const paymentCommand = require('./handlers/paymentCommand');
const markPaid = require('./handlers/markPaid');
const revenueCommand = require('./handlers/revenueCommand');

if (!config.token) {
  console.error('Missing DISCORD_TOKEN in your environment. Check .env / Railway variables.');
  process.exit(1);
}

// Guilds is the only intent required: buttons, select menus, modals, and slash
// commands all arrive via interaction payloads, and channel.messages.fetch()
// (used for transcripts and for finding the pinned panel) works over REST
// without needing the privileged Message Content intent.
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  await registerCommands();
  await panel.ensurePanel(c);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === 'payment') {
      await paymentCommand.handle(interaction);
    } else if (interaction.isChatInputCommand() && interaction.commandName === 'revenue') {
      await revenueCommand.handle(interaction);
    } else if (interaction.isButton() && interaction.customId === 'open_commission') {
      await openCommission.handle(interaction);
    } else if (interaction.isButton() && interaction.customId === 'close_ticket') {
      await closeTicket.handle(interaction);
    } else if (interaction.isButton() && interaction.customId === 'tos_agree') {
      await tosAgree.handle(interaction);
    } else if (interaction.isButton() && interaction.customId === 'request_feedback') {
      await requestFeedback.handle(interaction);
    } else if (interaction.isButton() && interaction.customId === 'leave_review') {
      await leaveReview.handle(interaction);
    } else if (interaction.isButton() && interaction.customId === 'mark_paid') {
      await markPaid.handle(interaction);
    } else if (interaction.isStringSelectMenu() && interaction.customId === 'commission_select') {
      await selectService.handle(interaction);
    } else if (interaction.isStringSelectMenu() && interaction.customId === 'review_stars') {
      await reviewStars.handle(interaction);
    } else if (interaction.isModalSubmit() && interaction.customId.startsWith('review_modal|')) {
      await submitReview.handle(interaction);
    }
  } catch (err) {
    console.error('Interaction error:', err);
    const payload = { content: 'Something went wrong. Please try again or contact staff.', flags: MessageFlags.Ephemeral };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
});

client.login(config.token);
