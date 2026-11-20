import test from 'node:test';
import assert from 'node:assert/strict';
import type { PayloadRequest } from 'payload';
import { isAdmin, isAdminUser, publishedOrAdmin } from '../collections/access';
import { Users } from '../collections/Users';

const deniedUsers = [null, undefined, {}, {id:2,collection:'users',role:'editor'}, {id:3,collection:'users'}, {id:4,collection:'customers',role:'admin'}];
const admin = {id:1,collection:'users',role:'admin'};
const args = (user: unknown) => ({req:{user} as PayloadRequest});

test('Only admins from the users collection have administrative privileges', () => {
  assert.equal(isAdminUser(admin), true);
  for (const user of deniedUsers) assert.equal(isAdminUser(user), false);
});

test('Legacy Editor sessions and missing/foreign roles cannot write protected data', () => {
  assert.equal(isAdmin(args(admin)), true);
  for (const user of deniedUsers) assert.equal(isAdmin(args(user)), false);
});

test('Visitors and legacy Editor sessions can only read published content', async () => {
  assert.equal(await publishedOrAdmin(args(admin)), true);
  for (const user of deniedUsers) {
    assert.deepEqual(await publishedOrAdmin(args(user)), {status:{equals:'published'}});
  }
});

test('Legacy users cannot log in, refresh a session or unlock accounts', async () => {
  const login = Users.hooks!.beforeLogin![0];
  const refresh = Users.hooks!.refresh![0];
  for (const user of deniedUsers) {
    const req = {user, t:(key:string)=>key} as unknown as PayloadRequest;
    await assert.rejects(async () => login({user,req} as Parameters<typeof login>[0]), {status:401});
    await assert.rejects(async () => refresh({user,args:{req}} as Parameters<typeof refresh>[0]), {status:401});
    assert.equal(await Users.access!.unlock!(args(user)), false);
  }
  const req = {user:admin} as unknown as PayloadRequest;
  assert.equal(await login({user:admin,req} as Parameters<typeof login>[0]), admin);
  assert.equal(await refresh({user:admin,args:{req}} as Parameters<typeof refresh>[0]), undefined);
  assert.equal(await Users.access!.unlock!(args(admin)), true);
});
