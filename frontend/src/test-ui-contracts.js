import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceDirectory = path.dirname(fileURLToPath(import.meta.url));
const readSource = (fileName) => fs.readFileSync(path.join(sourceDirectory, fileName), 'utf8');

const dialogSource = readSource('components/Dialog.jsx');
assert.match(dialogSource, /role="dialog"/);
assert.match(dialogSource, /aria-modal="true"/);
assert.match(dialogSource, /aria-labelledby=\{titleId\}/);
assert.match(dialogSource, /event\.key === 'Escape'/);
assert.match(dialogSource, /event\.key !== 'Tab'/);
assert.match(dialogSource, /previousActiveElement\.focus/);

const cssSource = readSource('index.css');
assert.match(cssSource, /prefers-reduced-motion:\s*reduce/);

const pageFiles = [
  'pages/DashboardPage.jsx',
  'pages/PaymentsPage.jsx',
  'pages/PropertiesPage.jsx',
  'pages/PropertyDetailPage.jsx',
  'pages/RentChargesPage.jsx',
  'pages/TenantDetailPage.jsx',
  'pages/TenantsPage.jsx',
];

for (const fileName of pageFiles) {
  const source = readSource(fileName);
  assert.doesNotMatch(source, /fixed inset-0 z-50/);
}

assert.doesNotMatch(readSource('components/AppLayout.jsx'), /Change password/);
assert.doesNotMatch(readSource('pages/LoginPage.jsx'), /Forgot password\?/);
assert.match(readSource('pages/LoginPage.jsx'), /Show password/);
assert.match(readSource('pages/ReportsPage.jsx'), /overflow-x-auto/);
assert.match(readSource('pages/RegisterPage.jsx'), /Terms of Service/);
assert.match(readSource('pages/RegisterPage.jsx'), /Privacy Policy/);
assert.match(readSource('pages/RegisterPage.jsx'), /required/);

console.log('Frontend accessibility and responsive contracts passed.');
