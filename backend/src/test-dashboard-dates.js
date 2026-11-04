import assert from 'node:assert/strict';
import {
  toPeriodDateString,
  toUtcDateString,
  toUtcDateTimeString,
} from './utils/dashboardDates.js';

const beforeMidnight = new Date('2026-01-31T23:59:59.999Z');
const afterMidnight = new Date('2026-02-01T00:00:00.000Z');

assert.equal(toUtcDateString(beforeMidnight), '2026-01-31');
assert.equal(toUtcDateString(afterMidnight), '2026-02-01');
assert.equal(toUtcDateTimeString(afterMidnight), '2026-02-01 00:00:00.000');

assert.equal(toPeriodDateString('2026-01'), '2026-01-01');
assert.equal(toPeriodDateString('2026-02'), '2026-02-01');

const dueAtMidnight = '2026-02-01';
assert.equal(dueAtMidnight < toUtcDateTimeString(afterMidnight), true);
assert.equal(dueAtMidnight < toUtcDateTimeString(beforeMidnight), false);
assert.equal('2026-02-02' < toUtcDateTimeString(afterMidnight), false);

console.log('Dashboard UTC date boundary tests passed.');
