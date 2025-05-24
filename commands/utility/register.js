const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const logger = require('pino')();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Register your team and choice in one command!')
        .addStringOption(option =>
            option.setName('teamname')
                .setDescription('Your team name')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('choice') 
                .setDescription('เลื่อนเพื่อเลือกประเภทการสรุปงาน')
                .setRequired(true)
                .addChoices( 
                    { name: '1. สรุปงานแบบทีมทั่วไป เหมาะสำหรับทีมที่ทำงานโปรเจกต์เดียว', value: 'single' },
                    { name: '2. สรุปงานแบบ Multi-Project เหมาะสำหรับทีมที่ทำงานหลายโปรเจกต์พร้อมกัน', value: 'multi' },
                    { name: '3. สรุปงาน เน้น Blockers เหมาะสำหรับทีมที่พบปัญหาบ่อยและต้องการความช่วยเหลือด่วน', value: 'blocker' },
                )
        ), 
    async execute(interaction) {
        const teamName = interaction.options.getString('teamname');
        const choice = interaction.options.getString('choice');

        logger.info(`Register command executed by ${interaction.user.username} (${interaction.user.id}) in channel ${interaction.channel.name} (${interaction.channel.id}) with team name: ${teamName} and choice: ${choice}`);

        const channel = interaction.channel;
        const channelName = channel.name;
        const channelId = channel.id;

        const payload = {
            service: 'register',
            timestamp: new Date().toISOString(),
            data: {
                id: channelId,
                teamName: teamName,
                choice: choice,
                user: {
                    id: interaction.user.id,
                    username: interaction.user.username,
                },
                guild: {
                    id: interaction.guild.id,
                    name: interaction.guild.name
                }
            }
        }

        try {
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
                // await interaction.editReply('Data successfully sent to n8n!');
                await interaction.editReply({
                    content: `✅ **Registration Complete!**\n- Team: **${teamName}**\n- Choice: **${choice}**`,
                    flags: MessageFlags.Ephemeral
                });
            } else {
                console.error('Failed to send data to n8n:', response.statusText);
                await interaction.editReply('Failed to send data to n8n.');
            }
        } catch (error) {
            console.error('Error:', error);
            await interaction.editReply('There was an error processing your request.');
        }

        // add data to ./events/channel.json
        const fs = require('fs');
        const path = require('path');
        const channelDataPath = path.join(__dirname, '../../events/channel.json');
        console.log(`Updating channel data at ${channelDataPath}`);
        const channelData = JSON.parse(fs.readFileSync(channelDataPath, 'utf8'));
        channelData[channelId] = {
            teamName: teamName,
            choice: choice,
            userId: interaction.user.id,
            username: interaction.user.username,
            guildId: interaction.guild.id,
            guildName: interaction.guild.name
        };

        fs.writeFileSync(channelDataPath, JSON.stringify(channelData, null, 2), 'utf8');
        console.log(`Channel data updated for channel ${channelId}: ${JSON.stringify(channelData[channelId])}`);


    },
};