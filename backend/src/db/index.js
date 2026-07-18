import pkg from 'pg';
import config from '../config/index.js';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: config.databaseUrl,
});

pool.on('error', (err) => {
  console.error('Lỗi bất ngờ trên pg client nhàn rỗi', err);
  process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);
export default pool;
