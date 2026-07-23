const { EmbedBuilder, MessageFlags } = require('discord.js');
const theme = require('../data/theme');
const config = require('../config');

async function handle(interaction) {
  const rating = parseInt(interaction.customId.split('|')[1], 10);
  const reviewText = interaction.fields.getTextInputValue('review_text');
  const stars = '⭐'.repeat(Math.min(Math.max(rating, 1), 5));

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (config.reviewsChannelId) {
    const reviewsChannel = await interaction.guild.channels.fetch(config.reviewsChannelId).catch(() => null);

    if (reviewsChannel) {
      const embed = new EmbedBuilder()
        .setColor(theme.gold)
        .setAuthor({
          name: interaction.user.displayName,
          iconURL: interaction.user.displayAvatarURL({ size: 128 }),
        })
        .setDescription(`### ${stars}\n> ${reviewText.replace(/\n/g, '\n> ')}`)
        .setFooter({ text: 'Studio Duo Commissions' })
        .setTimestamp();

      const guildIcon = interaction.guild.iconURL({ size: 128 });
      if (guildIcon) embed.setThumbnail(guildIcon);

      await reviewsChannel
        .send({ embeds: [embed] })
        .catch((err) => console.error('Failed to post review to reviews channel:', err));
    } else {
      console.warn('REVIEWS_CHANNEL_ID is set but the channel could not be found; skipping.');
    }
  } else {
    console.warn('REVIEWS_CHANNEL_ID is not configured; review was not posted anywhere.');
  }

  await interaction.channel
    .send({ content: `✅ <@${interaction.user.id}> left a review — thank you!` })
    .catch(() => {});

  await interaction.editReply({ content: 'Thanks so much for the feedback! 🎉' });
}

module.exports = { handle };
