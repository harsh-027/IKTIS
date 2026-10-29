import { spawnSync } from 'node:child_process';

const suite = process.argv[2];

if (!suite) {
  console.error('A database-backed test suite is required.');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production') {
  console.error('Database-backed integration tests cannot run with NODE_ENV=production.');
  process.exit(1);
}

if (process.env.NODE_ENV !== 'test') {
  console.error('Set NODE_ENV=test before running database-backed integration tests.');
  process.exit(1);
}

if (!process.env.TEST_DATABASE_URL?.trim()) {
  console.error('TEST_DATABASE_URL must be configured before running database-backed integration tests.');
  process.exit(1);
}

const result = spawnSync(process.execPath, [suite], {
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error(`Unable to start database-backed test suite: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
