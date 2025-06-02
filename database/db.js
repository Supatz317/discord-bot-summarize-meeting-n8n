// import postgres from 'postgres'
const postgres = require('postgres')
const NodeCache = require('node-cache');

const connectionString = process.env.DATABASE_URL
const sql = postgres(connectionString)

// Check if the connection is successful
sql`SELECT 1`
  .then(() => {
    console.log('Database connection successful');
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
  });

// export default sql
// module.exports = {sql};


const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

function queryChannel() {
    return sql`SELECT channel_id FROM team`;
}

function setCache(key, value, ttl = 3600) {
  cache.set(key, value, ttl);
}

function getCache(key) {
  return cache.get(key);
}
// Cached query function
async function cachedQuery(key, query, params = [], ttl = 3600) {

  // Try to get from cache first
  let data = cache.get(key);
  
  if (data === undefined) {
    console.log(`Cache miss for ${key}, querying database...`);
    data = await sql`SELECT channel_id FROM team`;
    console.log(`Data retrieved: ${JSON.stringify(data)}`);

    cache.set(key, data, ttl);
  } else {
    console.log(`Cache hit for ${key}`);
  }
  
  return data;
}

async function getChannel() {
  return cachedQuery(
    'channel',                // cache key
    'SELECT channel_id FROM team',      // SQL query
    [],                        // query parameters
    60                         // TTL in seconds (optional)
  );
}

module.exports = {
  sql,
  cachedQuery,
  getChannel,
    setCache,
    getCache,
    queryChannel

};
