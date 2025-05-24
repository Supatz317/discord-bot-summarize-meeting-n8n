const { SlashCommandBuilder, MessageFlags } = require('discord.js');

// load env variables
require('dotenv').config();

// test send msg to n8n
module.exports = {
    data: new SlashCommandBuilder()
        .setName('send')
        .setDescription('Send a message to n8n')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to send')
                .setRequired(true)),
    async execute(interaction) {
        const message = interaction.options.getString('message');
        const channel = interaction.client.channels.cache.get(interaction.channelId);
        if (!channel) {
            return interaction.reply({ content: 'Channel not found', ephemeral: true });
        }
        // await channel.send(message);
        // await interaction.reply({ content: 'Message sent', ephemeral: true });

        // Send message to n8n webhook
        const payload = {
            discordUser: {
                id: interaction.user.id,
                username: interaction.user.username,
                tag: interaction.user.tag
            },
            commandData: {
                message: message,
                commandName: interaction.commandName,
                channelId: interaction.channelId,
                guildId: interaction.guildId
            },
            timestamp: new Date().toISOString()
        };

        try {
            // Defer the reply while we process the request
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // Send the data to n8n
            const response = await fetch(process.env.N8N_WEBHOOK, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                await interaction.editReply('Data successfully sent to n8n!');
            } else {
                await interaction.editReply('Failed to send data to n8n.');
            }
        } catch (error) {
            console.error('Error:', error);
            await interaction.editReply('There was an error processing your request.');
        }
    }
};