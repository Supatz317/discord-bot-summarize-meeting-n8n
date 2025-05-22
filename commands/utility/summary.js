const { SlashCommandBuilder, MessageFlags } = require('discord.js');

// load env variables
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('summary-daily')
        .setDescription('Get a summary of the daily messages [manually]')
        .addStringOption(option =>
            option.setName('date')
                .setDescription('The date to summarize')
                .setRequired(false)),
    async execute(interaction) {
        // send message to n8n then get response send to discord
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const date = interaction.options.getString('date')

        const payload = {
            service: 'summary',
            date: date,
            channelId: interaction.channelId,
            guildId: interaction.guildId,
        };

        try {
            // Send the data to n8n
            const response = await fetch(process.env.N8N_WEBHOOK, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                await interaction.editReply(data.output);
            } else {
                await interaction.editReply('Failed to get summary from n8n.');
            }
        } catch (error) {
            console.error('Error:', error);
            await interaction.editReply('There was an error processing your request.');
        }
    },
};