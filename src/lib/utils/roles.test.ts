import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getRoleLabel, getPlanTitle, getDateLabel } from './roles';

test('roles: role labels adapt to eventType while preserving permissions', () => {
  // Wedding
  assert.equal(getRoleLabel('couple', 'wedding'), 'Couple');
  assert.equal(getRoleLabel('voter', 'wedding'), 'Voter');
  assert.equal(getRoleLabel('advisor', 'wedding'), 'Advisor');
  assert.equal(getRoleLabel('viewer', 'wedding'), 'Viewer');

  // Birthday
  assert.equal(getRoleLabel('couple', 'birthday'), 'Host');
  assert.equal(getRoleLabel('voter', 'birthday'), 'Voter');
  assert.equal(getRoleLabel('advisor', 'birthday'), 'Advisor');
  assert.equal(getRoleLabel('viewer', 'birthday'), 'Viewer');

  // Community
  assert.equal(getRoleLabel('couple', 'community'), 'Organiser');
  assert.equal(getRoleLabel('voter', 'community'), 'Voter');
  assert.equal(getRoleLabel('advisor', 'community'), 'Advisor');
  assert.equal(getRoleLabel('viewer', 'community'), 'Viewer');
});

test('roles: titles and date labels adapt per eventType', () => {
  assert.equal(getPlanTitle('wedding'), 'Wedding Plan');
  assert.equal(getPlanTitle('birthday'), 'Birthday Plan');
  assert.equal(getPlanTitle('community'), 'Event Logistics & Plan');

  assert.equal(getDateLabel('wedding'), 'Wedding Date');
  assert.equal(getDateLabel('birthday'), 'Birthday Date');
  assert.equal(getDateLabel('community'), 'Event Date');
});

