import assert from 'node:assert/strict';
import {
  DEFAULT_SAFETY_DOCUMENT_TYPES,
  buildEmployeeSafetyRecords,
  filterEmployeeSafetyRecords,
  normalizeSafetyName,
  safetyNamesMatch,
  safetyRecordSummary
} from '../assets/js/records/safety-records.js';

assert.equal(DEFAULT_SAFETY_DOCUMENT_TYPES.includes('Pre-Task Plan'), false);
assert.equal(normalizeSafetyName(' José  Rivera '), 'jose rivera');
assert.equal(safetyNamesMatch('José Rivera', 'Jose M. Rivera'), true);

const forms = [{
  id: 'form-1',
  projectId: 'project-1',
  projectName: 'Queens Plaza South',
  formKey: 'daily-safety-meeting',
  formTitle: 'Daily Safety Meeting',
  documentData: {
    date: '2026-08-20',
    items_discussed: 'Proper lifting and material handling',
    hazard1: 'Back injury from a heavy lift',
    control1: 'Use a team lift or mechanical assistance',
    signIns: [{ printName: 'Jose Rivera', signature: 'Jose Rivera' }]
  }
}, {
  id: 'form-2',
  projectId: 'project-1',
  projectName: 'Queens Plaza South',
  formKey: 'weekly-payroll',
  formTitle: 'Weekly Payroll',
  documentData: { date: '2026-08-21', rows: [{ workerName: 'Jose Rivera', totalHours: '8' }] }
}];

const records = buildEmployeeSafetyRecords({ employeeName: 'José Rivera', forms });
assert.equal(records.length, 2);
assert.equal(records.some(record => record.topics.includes('Proper Lifting')), true);
assert.equal(filterEmployeeSafetyRecords(records, { safetyTopic: 'Proper Lifting' }).length, 1);
assert.deepEqual(safetyRecordSummary(records, 2), { total: 2, safety: 1, properLifting: 1, attention: 2 });

console.log('Safety record helper tests passed.');
