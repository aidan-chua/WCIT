import pg from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'SET' : 'NOT SET');
console.log('DB_HOST:', process.env.DB_HOST);

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