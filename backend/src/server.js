import 'dotenv/config';   // nạp backend/.env trước khi đọc config (DATABASE_URL, ...)
import { createApp } from './app.js';
import config from './config/index.js';
import db from './db/index.js';
import { seedAdmin } from './db/seed.js';
import { runMigrations } from './db/migrate.js';

// Chờ Postgres sẵn sàng (container DB có thể khởi động chậm hơn backend)
async function waitForDb(retries = 15, delayMs = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await db.query('SELECT 1');
      return;
    } catch (err) {
      console.log(`  DB chưa sẵn sàng (thử ${i}/${retries})... ${err.code || err.message}`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error('Không kết nối được Postgres sau nhiều lần thử.');
}

const app = createApp();

await waitForDb();
await runMigrations();
await seedAdmin();

const server = app.listen(config.port, () => {
  console.log('');
  console.log('IKA Fashion Backend');
  console.log(`  Server   : http://localhost:${config.port}`);
  console.log(`  API Docs : http://localhost:${config.port}/api-docs`);
  console.log(`  Health   : http://localhost:${config.port}/api/health`);
  console.log('');
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT',  () => server.close(() => process.exit(0)));
