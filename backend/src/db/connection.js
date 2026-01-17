import pg from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';

// Force IPv4 DNS resolutions (perfer IPv4 over Ipv6)
dns.setDefaultResultOrder('ipv4first');

dotenv.config();
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'SET' : 'NOT SET');

const {Pool} = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? {rejectUnauthorized: false} : false
});

//Test connection
pool.on('connect', () => {
    console.log('Connected to PostegreSQL database');
});

pool.on('error', (err) => {
    console.error('PostegrSQL connection error:', err);
});

export default pool;