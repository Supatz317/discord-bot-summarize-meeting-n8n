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
            return interaction.reply({ content: 'Channel not found', flags: MessageFlags.Ephemeral });
        }
        // await channel.send(message);
        // await interaction.reply({ content: 'Message sent', ephemeral: true });

        // Send message to n8n webhook
        const payload = {
            service: 'send',
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
                const data = await response.json();
                console.log(2);
                // Check if the response contains the expected data
                // logger.info(`Response from n8n: ${JSON.stringify(data)}`);
                const result = data.result.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\')
                console.log(result);

                await interaction.editReply({
                    content : result.substring(0, 2000) // Discord has a limit of 2000 characters per message
                    // .replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\'),
                    ,flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.editReply('Failed to send data to n8n.');
            }
        } catch (error) {
            console.error('Error:', error);
            await interaction.editReply({
                content: `There was an error processing your request. ${error.message}`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
};