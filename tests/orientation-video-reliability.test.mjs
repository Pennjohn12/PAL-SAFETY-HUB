import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../projects.html', import.meta.url), 'utf8');

test('orientation video never leaves an unexplained blank player', () => {
  assert.match(html, /orientation-video-spinner/);
  assert.match(html, /Loading orientation video/);
  assert.match(html, /The video did not load/);
  assert.match(html, /Try Again/);
  assert.match(html, /Check YouTube/);
});

test('YouTube API and player both have bounded loading failures', () => {
  assert.match(html, /YouTube player took too long to load/);
  assert.match(html, /script\.onerror/);
  assert.match(html, /orientationSession\.loadTimer = setTimeout/);
  assert.match(html, /onError: event/);
});

test('retry control is callable from the orientation form', () => {
  assert.match(html, /function retryOrientationVideo\(\)/);
  assert.match(html, /window\.retryOrientationVideo = retryOrientationVideo/);
});

