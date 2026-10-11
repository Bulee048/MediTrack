import 'dotenv/config';
import mongoose from 'mongoose';
import { setServers } from 'node:dns';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { env } from '../src/config/env.js';

async function main() {
  const label = process.argv[2];
  if (!label || !/^[a-z]+$/i.test(label)) throw new Error('Provide a single alphabetic display label to remove');
  if (env.NODE_ENV === 'production' || process.env.DEMO_ENV !== 'true' || env.MONGODB_DB_NAME !== 'meditrack_demo') throw new Error('Explicit non-production demo configuration required');
  if (process.env.TEST_DNS_SERVERS) setServers(process.env.TEST_DNS_SERVERS.split(','));
  await mongoose.connect(env.MONGODB_URI, { dbName: 'meditrack_demo' });
  if (mongoose.connection.name !== 'meditrack_demo') throw new Error('Demo database mismatch');
  const db = mongoose.connection.db!;
  if (!await db.collection('demo_seed_manifests').findOne({ complete: true })) throw new Error('Completed demo manifest required');
  const clean = (text: string) => text.replace(new RegExp(`\\s*\\(${label}\\)`, 'gi'), '').replace(new RegExp(`\\b${label}\\b\\s*`, 'gi'), '').replace(/\(\s+/g, '(').trim();
  let changed = 0;
  for (const [collection, fields] of Object.entries({ users: ['name', 'address'], doctors: ['name', 'title'], departments: ['name', 'description'], familymembers: ['name'], appointments: ['reason'], notifications: ['title', 'message'] })) {
    for (const record of await db.collection(collection).find({ $or: fields.map(field => ({ [field]: { $regex: label, $options: 'i' } })) }).toArray()) {
      const updates: Record<string, string> = {};
      for (const field of fields) if (typeof record[field] === 'string' && clean(record[field]) !== record[field]) updates[field] = clean(record[field]);
      if (Object.keys(updates).length) { await db.collection(collection).updateOne({ _id: record._id }, { $set: updates }); changed++; }
    }
  }
  for (const name of ['credentials.json', 'browser-walk-in.json']) {
    const path = resolve('.demo', name);
    try {
      const data = JSON.parse(await readFile(path, 'utf8'));
      if (Array.isArray(data.accounts)) for (const account of data.accounts) if (typeof account.name === 'string') account.name = clean(account.name);
      if (typeof data.name === 'string') data.name = clean(data.name);
      await writeFile(path, JSON.stringify(data, null, 2), { mode: 0o600 });
    } catch (error) { if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error; }
  }
  console.log(`Updated ${changed} demo display records. IDs, passwords, appointments, queue states and ownership remain unchanged.`);
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Display update failed'); process.exitCode = 1; }).finally(() => mongoose.disconnect());
