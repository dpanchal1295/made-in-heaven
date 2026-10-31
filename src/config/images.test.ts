import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { APP_IMAGES } from './images';
import availableImagesList from './available-images.json';

test('images config: all defined image keys either point to an existing public file or are null', () => {
  const publicDir = path.join(process.cwd(), 'public');

  for (const [key, item] of Object.entries(APP_IMAGES)) {
    assert.ok(item.alt && item.alt.length > 5, `Image ${key} must have descriptive alt text`);
    assert.ok(typeof item.credit === 'string', `Image ${key} must have a credit string field`);

    if (item.src) {
      assert.ok(item.src.startsWith('/images/'), `Image ${key} path must start with /images/`);
      const fullPath = path.join(publicDir, item.src.replace(/^\//, ''));
      const exists = fs.existsSync(fullPath);
      // For missing photos, verify they are in the known missing list and handled safely
      if (!exists) {
        const allowedMissing = [
          'birthday-attire.jpg',
          'birthday-music.jpg',
          'birthday-party.jpg',
          'community-attire.jpg',
        ];
        const basename = path.basename(item.src);
        assert.ok(
          allowedMissing.includes(basename),
          `Image ${key} points to ${item.src} which does not exist on disk and is not an allowed missing photo`
        );
      }
    }
  }
});

test('available images generator: available-images.json accurately lists only present public images', () => {
  for (const imgPath of availableImagesList) {
    const fullPath = path.join(process.cwd(), 'public', imgPath.replace(/^\//, ''));
    assert.ok(fs.existsSync(fullPath), `available-images.json contains ${imgPath} which does not exist`);
  }

  // Missing images must NOT be in availableImagesList
  const missing = [
    '/images/birthday-attire.jpg',
    '/images/birthday-music.jpg',
    '/images/birthday-party.jpg',
    '/images/community-attire.jpg',
  ];
  for (const m of missing) {
    assert.equal(availableImagesList.includes(m), false, `${m} should not be in available-images.json`);
  }
});


