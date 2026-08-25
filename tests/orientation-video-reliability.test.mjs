import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../projects.html', import.meta.url), 'utf8');

test('orientation video never leaves an unexplained blank player', () => {
  assert.match(html, /orientation-video-spinner/);
  assert.match(html, /Loading orientation video/);
  assert.match(html, /This device could not connect to the video/);
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

test('a failed YouTube script is removed so retry makes a fresh request', () => {
  assert.match(html, /script\?\.remove\(\)/);
  assert.match(html, /orientationYouTubeApiPromise = null/);
  assert.match(html, /script = document\.createElement\('script'\)/);
});

test('slow video startup retries once automatically and ignores stale players', () => {
  assert.match(html, /Connection is slow\. Retrying automatically/);
  assert.match(html, /loadAttempt < 1/);
  assert.match(html, /orientationVideoLoadGeneration/);
  assert.match(html, /loadGeneration !== orientationVideoLoadGeneration/);
});

test('final video errors distinguish PAL from device or network access', () => {
  assert.match(html, /PAL Safety Hub opened correctly, but this device or network could not connect to YouTube/);
  assert.match(html, /content blockers, or YouTube restrictions/);
});

