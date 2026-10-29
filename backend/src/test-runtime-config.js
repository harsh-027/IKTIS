import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modulePath = './src/config/runtimeConfig.js';

function runConfig(env, code = `import('${modulePath}')`) {
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', code],
    {
      cwd: backendDirectory,
      encoding: 'utf8',
      env: { ...process.env, ...env },
    }
  );
  return result;
}

function assertFails(env, expectedMessage) {
  const result = runConfig(env);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stderr}${result.stdout}`, new RegExp(expectedMessage));
}

assertFails(
  { NODE_ENV: 'production', DATABASE_URL: '', FRONTEND_URL: 'https://iktis.vercel.app' },
  'DATABASE_URL must be configured'
);
assertFails(
  { NODE_ENV: 'production', DATABASE_URL: 'mysql://test', FRONTEND_URL: 'http://localhost:5173' },
  'FRONTEND_URL must be a non-local HTTPS origin'
);
assertFails(
  { NODE_ENV: 'staging', DATABASE_URL: 'mysql://test', FRONTEND_URL: 'https://iktis.vercel.app' },
  'NODE_ENV must be one of'
);
assertFails(
  { NODE_ENV: 'test', DATABASE_URL: 'mysql://development', TEST_DATABASE_URL: '' },
  'TEST_DATABASE_URL must be configured'
);
assertFails(
  { NODE_ENV: 'test', DATABASE_URL: 'mysql://same', TEST_DATABASE_URL: 'mysql://same' },
  'TEST_DATABASE_URL must not match DATABASE_URL'
);
assertFails(
  { NODE_ENV: 'test', DATABASE_URL: 'mysql://development', TEST_DATABASE_URL: 'postgres://test' },
  'TEST_DATABASE_URL must be a valid MySQL connection URL'
);

const validTest = runConfig({
  NODE_ENV: 'test',
  DATABASE_URL: 'mysql://development',
  TEST_DATABASE_URL: 'mysql://test-user:test-password@test-host:3306/iktis_integration_test',
});
assert.equal(validTest.status, 0, validTest.stderr);

const validProduction = runConfig({
  NODE_ENV: 'production',
  DATABASE_URL: 'mysql://test',
  FRONTEND_URL: 'https://iktis.vercel.app',
}, `import { runtimeConfig, getCookieSecurityOptions } from '${modulePath}'; console.log(JSON.stringify({ frontendUrl: runtimeConfig.frontendUrl, cookies: getCookieSecurityOptions() }));`);
assert.equal(validProduction.status, 0, validProduction.stderr);
const validProductionOutput = JSON.parse(validProduction.stdout.trim());
assert.equal(validProductionOutput.frontendUrl, 'https://iktis.vercel.app');
assert.deepEqual(validProductionOutput.cookies, { secure: true, sameSite: 'none' });

const corsCheck = runConfig({
  NODE_ENV: 'production',
  DATABASE_URL: 'mysql://test',
  FRONTEND_URL: 'https://iktis.vercel.app',
}, `import http from 'node:http'; import app from './src/server.js'; const server = app.listen(0, () => { const { port } = server.address(); const request = http.request({ port, path: '/api/health', method: 'OPTIONS', headers: { Origin: 'https://iktis.vercel.app', 'Access-Control-Request-Method': 'GET' } }, (response) => { console.log(JSON.stringify({ status: response.statusCode, allowOrigin: response.headers['access-control-allow-origin'], allowCredentials: response.headers['access-control-allow-credentials'] })); server.close(); }); request.on('error', (error) => { console.error(error); server.close(() => process.exit(1)); }); request.end(); });`);
assert.equal(corsCheck.status, 0, corsCheck.stderr);
assert.deepEqual(JSON.parse(corsCheck.stdout.trim()), {
  status: 204,
  allowOrigin: 'https://iktis.vercel.app',
  allowCredentials: 'true',
});

console.log('Runtime configuration tests passed.');
