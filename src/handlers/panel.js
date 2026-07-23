const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const services = require('../data/services');
const theme = require('../data/theme');
const config = require('../config');

const PANEL_TITLE = '📋 Studio Duo Commissions';

function buildPanel(guild) {
  const embed = new EmbedBuilder()
    .setTitle(PANEL_TITLE)
    .setColor(theme.brand)
    .setDescription(
      "Want to commission custom work from Studio Duo? Click **Open Commission** below to get started — " +
        'you can select as many services as you need.'
    )
    .addFields(
      Object.values(services)
        .filter((s) => !s.hideFromPanel)
        .map((s) => ({
          name: `${s.emoji} ${s.label}`,
          value: s.price ? `Starting at $${s.price}` : 'Custom quote',
          inline: true,
        }))
    )
    .setFooter({ text: 'Starting prices are a baseline — final quotes depend on scope.' });

  const guildIcon = guild?.iconURL({ size: 256 });
  if (guildIcon) embed.setThumbnail(guildIcon);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('open_commission')
      .setLabel('Open Commission')
      .setEmoji('🎟️')
      .setStyle(ButtonStyle.Primary)
  );

  return { embed, row };
}

/**
 * Called once on bot startup. Makes sure the commissions channel has a pinned
 * panel embed with the Open Commission button. If one's already pinned there
 * (posted by this bot), it's left alone. If it's missing — first run, or someone
 * unpinned/deleted it — a fresh one is posted and pinned automatically.
 */
async function ensurePanel(client) {
  if (!config.commissionsChannelId) {
    console.warn('COMMISSIONS_CHANNEL_ID is not set; skipping panel setup.');
    return;
  }

  const channel = await client.channels.fetch(config.commissionsChannelId).catch((err) => {
    console.error('Could not fetch COMMISSIONS_CHANNEL_ID channel:', err.message);
    return null;
  });
  if (!channel) return;

  const pinned = await channel.messages.fetchPins().catch((err) => {
    console.error('Could not fetch pinned messages in commissions channel:', err.message);
    return null;
  });

  const alreadyPosted = pinned?.items.find(
    (item) => item.message.author.id === client.user.id && item.message.embeds[0]?.title === PANEL_TITLE
  );
  if (alreadyPosted) {
    console.log('Commission panel already pinned; leaving it as-is.');
    return;
  }

  const { embed, row } = buildPanel(channel.guild);
  const msg = await channel.send({ embeds: [embed], components: [row] });
  await msg.pin().catch((err) => console.warn('Could not pin panel message:', err.message));
  console.log('Posted and pinned a new commission panel.');
}

module.exports = { buildPanel, ensurePanel };
