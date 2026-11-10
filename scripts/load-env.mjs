import { config } from 'dotenv';

// Shell and hosting environment variables take precedence over local files.
config({ path: ['.env.local', '.env'], override: false, quiet: true });
