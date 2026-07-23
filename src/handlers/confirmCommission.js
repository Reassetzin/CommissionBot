const {
  ChannelType,
  PermissionFlagsBits,
  OverwriteType,
  MessageFlags,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const services = require('../data/services');
const theme = require('../data/theme');
const tos = require('../data/tos');
const config = require('../config');
const { ticketChannelName } = require('../utils/sanitize');

async function handle(interaction) {
  const selectedKeys = interaction.customId.split('|')[1]?.split(',').filter(Boolean) || [];
  const selectedServices = selectedKeys.map((k) => services[k]).filter(Boolean);
  const channelName = ticketChannelName(interaction.user.username);

  // Final guardrail check right before creating anything, in case a ticket
  // was opened in the window between selecting and confirming.
  const existing = interaction.guild.channels.cache.find((c) => c.name === channelName);
  if (existing) {
    return interaction.update({
      content: `You already have an open commission ticket: <#${existing.id}>.`,
      components: [],
    });
  }

  await interaction.update({ content: '🎟️ Creating your ticket...', components: [] });

  const overwrites = [
    {
      id: interaction.guild.roles.everyone.id,
      type: OverwriteType.Role,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: interaction.user.id,
      type: OverwriteType.Member,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    {
      // Without this, the @everyone deny above blocks the bot too (unless it
      // happens to have server-wide Administrator), so it can create the
      // channel but then fail to post the summary embed into it.
      id: interaction.client.user.id,
      type: OverwriteType.Member,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ManageChannels,
      ],
    },
  ];
  if (config.staffRoleId) {
    overwrites.push({
      id: config.staffRoleId,
      type: OverwriteType.Role,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    });
  }

  let channel;
  try {
    channel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: config.commissionsCategoryId || undefined,
      topic: `Commission ticket opened by ${interaction.user.id} (${interaction.user.tag})`,
      permissionOverwrites: overwrites,
    });
  } catch (err) {
    console.error('Failed to create ticket channel:', err);
    return interaction.followUp({
      content:
        'Something went wrong creating your ticket channel. Please contact staff directly, or try again in a moment.',
      flags: MessageFlags.Ephemeral,
    });
  }

  const numericTotal = selectedServices.reduce((sum, s) => (s.price ? sum + s.price : sum), 0);
  const hasCustomQuote = selectedServices.some((s) => s.price === null);
  const totalLine = hasCustomQuote
    ? numericTotal > 0
      ? `$${numericTotal}+ (plus a custom quote item)`
      : 'Custom quote needed'
    : `$${numericTotal}`;

  const summaryEmbed = new EmbedBuilder()
    .setTitle('🎟️ New Commission Request')
    .setColor(theme.success)
    .setAuthor({
      name: interaction.user.displayName,
      iconURL: interaction.user.displayAvatarURL({ size: 128 }),
    })
    .addFields(
      ...selectedServices.map((s) => ({
        name: `${s.emoji} ${s.label}`,
        value: s.price ? `Starting at $${s.price}` : 'Custom quote',
        inline: true,
      })),
      { name: '💰 Starting total', value: totalLine, inline: true },
      {
        name: '📝 Next steps',
        value:
          "Reply here with your **deadline** and a short **description** of what you need — references, style, scope, anything that helps. We'll follow up with a full quote.",
        inline: false,
      }
    )
    .setTimestamp()
    .setFooter({ text: `Studio Duo Commissions • ${interaction.user.tag}` });

  const guildIcon = interaction.guild.iconURL({ size: 128 });
  if (guildIcon) summaryEmbed.setThumbnail(guildIcon);

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Close Ticket')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger)
  );

  const pingParts = [];
  if (config.notifyRoleId) pingParts.push(`<@&${config.notifyRoleId}>`);
  pingParts.push(`New commission ticket from <@${interaction.user.id}>`);

  await channel.send({ content: pingParts.join(' '), embeds: [summaryEmbed], components: [closeRow] });

  const tosEmbed = new EmbedBuilder()
    .setTitle(tos.title)
    .setColor(theme.info)
    .setDescription(tos.points.map((p) => `• ${p}`).join('\n\n'))
    .setFooter({ text: 'Please agree before we start work on your commission.' });

  const tosRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tos_agree').setLabel('I Agree').setEmoji('✅').setStyle(ButtonStyle.Success)
  );

  await channel.send({ embeds: [tosEmbed], components: [tosRow] });

  await interaction.followUp({
    content: `Your commission ticket has been created: <#${channel.id}>`,
    flags: MessageFlags.Ephemeral,
  });
}

module.exports = { handle };
