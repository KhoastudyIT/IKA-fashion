import { createApp } from './app.js';
import config from './config/index.js';
import { seedAdmin } from './db/seed.js';

const app = createApp();

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
