'use strict';

async function runInitialScanRetry({ mode = 'disabled', execute } = {}) {
  if (mode !== 'enforce') return { mode: 'disabled', inspected: 0, queued: 0 };
  if (typeof execute !== 'function') throw new Error('retry-executor-required');
  return execute();
}

module.exports = { runInitialScanRetry };
