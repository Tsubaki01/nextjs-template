#!/usr/bin/env tsx

import * as readline from 'node:readline';
import { execSync } from 'node:child_process';
import process from 'node:process';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter migration name (e.g., add-user-table): ', (name: string) => {
  if (!name) {
    console.error('❌ Migration name is required');
    rl.close();
    process.exit(1);
  }

  // 名前の検証（英数字とハイフンのみ）
  if (!/^[a-z0-9-]+$/.test(name)) {
    console.error('❌ Migration name should only contain lowercase letters, numbers, and hyphens');
    rl.close();
    process.exit(1);
  }

  console.log(`\n📝 Generating migration: ${name}\n`);

  try {
    execSync(`pnpm drizzle-kit generate --name="${name}"`, {
      stdio: 'inherit',
    });
    console.log(`\n✅ Migration "${name}" generated successfully!`);
  } catch (error) {
    console.error('\n❌ Failed to generate migration:', error instanceof Error ? error.message : String(error));
    rl.close();
    process.exit(1);
  }

  rl.close();
});