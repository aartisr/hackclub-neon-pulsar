import { randomBytes } from 'node:crypto';

const key = randomBytes(16).toString('hex');
console.log(`INDEXNOW_KEY=${key}`);
console.log('Set this value in your production build environment and local .env.local file. Deploy the site before running npm run indexnow:submit.');
