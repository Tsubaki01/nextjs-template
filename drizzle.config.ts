import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

// DATABASE_URLの存在を明示的に検証
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Error: DATABASE_URL environment variable is not defined');
  process.exit(1);
}

export default defineConfig({
  out: './drizzle/migrations',
  schema: './drizzle/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
