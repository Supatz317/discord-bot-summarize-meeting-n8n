import sql from "./db";

 async function getChannels() {
    const channels = await sql`
        SELECT channel_id FROM team
    `;
    return channels.map(c => ({ channel_id: c.channel_id }));
}

// example usage
const channel = await getChannels();

// convert to  list 
// const channelList = channel.map(c => ({ channel_id: c.channel_id }));

// console.log(channelList); // { channel_id: 1 }
// const demo_channel = channelList[0];

// check if channel exists in list
export function channelExists(channelId) {
    return channelList.some(c => c.channel_id === channelId);
}

// example usage
// const exists = channelExists(demo_channel.channel_id);
// console.log(exists); // true