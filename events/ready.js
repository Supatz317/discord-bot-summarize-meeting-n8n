const { Events } = require('discord.js');
const { setCache, getChannel, getCache } = require('../database/db');


module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		const channels = getChannel(); // or await queryChannel() if that's your function
        setCache('channels', channels);
        console.log('Channel list cached on startup.');

	},
};