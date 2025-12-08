import pool from './connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeDatabase() {
    try {
        const schema = fs.readFileSync(
            path.join(__dirname, 'schema.sql'),
            'utf8'
        );

        await pool.query(schema);
        console.log('Database schema initialized');
    } catch (error) {
        console.error('Database initialization error', error);
        throw error;
    }
}
