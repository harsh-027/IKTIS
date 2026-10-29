import { spawnSync } from 'node:child_process';

const suites = [
  'test-auth.js',
  'test-properties-rooms.js',
  'test-tenants-tenancies.js',
  'test-rent-charges.js',
  'test-payments-receipts.js',
  'test-dashboard-reports.js',
];

for (const suite of suites) {
  const result = spawnSync(process.execPath, [`src/${suite}`], {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
