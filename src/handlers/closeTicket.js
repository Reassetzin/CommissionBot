const zlib = require('zlib');
const { EmbedBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const config = require('../config');
const theme = require('../data/theme');
const { buildTranscript } = require('../utils/transcript');

function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (mins || parts.length === 0) parts.push(`${mins}m`);
  return parts.join(' ');
}

async function handle(interaction) {
  if (!config.staffRoleId || !interaction.member.roles.cache.has(config.staffRoleId)) {
    return interaction.reply({ content: 'Only staff can close tickets.', flags: MessageFlags.Ephemeral });
  }

  await interaction.reply({ content: '🔒 Closing this ticket and saving a transcript...' });

  const channel = interaction.channel;
  const transcriptText = await buildTranscript(channel);
  const duration = formatDuration(Date.now() - channel.createdTimestamp);

  if (config.logChannelId) {
    const logChannel = await interaction.guild.channels.fetch(config.logChannelId).catch(() => null);

    if (logChannel) {
      // Gzipped so Discord doesn't auto-render a raw text preview above the
      // attachment card — still just as downloadable, just not previewed inline.
      const gzipped = zlib.gzipSync(Buffer.from(transcriptText, 'utf-8'));
      const attachment = new AttachmentBuilder(gzipped, {
        name: `${channel.name}-transcript.txt.gz`,
      });

      const logEmbed = new EmbedBuilder()
        .setTitle('🗒️ Commission Ticket Closed')
        .setColor(theme.closed)
        .setAuthor({
          name: interaction.user.displayName,
          iconURL: interaction.user.displayAvatarURL({ size: 128 }),
        })
        .addFields(
          { name: 'Channel', value: `#${channel.name}`, inline: true },
          { name: 'Closed by', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Open for', value: duration, inline: true },
          { name: 'Ticket info', value: channel.topic || 'N/A', inline: false }
        )
        .setTimestamp();

      await logChannel
        .send({ embeds: [logEmbed], files: [attachment] })
        .catch((err) => console.error('Failed to send transcript to log channel:', err));
    } else {
      console.warn('LOG_CHANNEL_ID is set but the channel could not be found; skipping transcript log.');
    }
  } else {
    console.warn('LOG_CHANNEL_ID is not configured; skipping transcript log.');
  }

  setTimeout(() => {
    channel.delete('Commission ticket closed').catch((err) => console.error('Failed to delete ticket channel:', err));
  }, 5000);
}

module.exports = { handle };
