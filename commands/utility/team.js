const { SlashCommandBuilder, MessageFlags } = require('discord.js');

// load env variables
require('dotenv').config();


// show team info 
module.exports = {
    data: new SlashCommandBuilder()
        .setName('team')
        .setDescription('Show your team information'),
    async execute(interaction) {
        
        // send message to n8n then get response send to discord
        await interaction.deferReply({flags: MessageFlags.Ephemeral});
        
        const payload = {
            service: 'team',
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

            console.log(`status: ${response.status} ${response.statusText}`);

            if (response.ok) {
                const data = await response.json();
                // Check if the response contains the expected data
                console.log(`Response from n8n: ${JSON.stringify(data)}`);
                if (!data || !Array.isArray(data) || data.length === 0) {
                    await interaction.editReply('No team information found.');
                    return;
                }
                const result = data[0];

                // await interaction.editReply(result.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
                await interaction.editReply({
                    content: `✅ **Registration Complete!**\n- Team: **${result.team_name}**\n- description: **${result.description}**`,
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.editReply({
                    content: '[team] Failed to get team information from n8n.',
                    flags: MessageFlags.Ephemeral
                });
            }
        } catch (error) {
            console.error(`Error: ${error.message}`);
            await interaction.editReply({
                content : `There was an error processing your request. ${error.message}`,
                flags: MessageFlags.Ephemeral
            });
        }
    },
};