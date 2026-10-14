import mongoose, { Schema, type ClientSession } from 'mongoose';

// Serialize identity checks and writes across application instances without
// replacing existing User indexes or assuming legacy data is duplicate-free.
const AccountWriteLock = mongoose.model('AccountWriteLock', new Schema({
  _id: { type: String, required: true }, revision: { type: Number, default: 0 },
}, { versionKey: false }));
let initialized: Promise<unknown> | undefined;
export async function withAccountWrite<T>(write: (session: ClientSession) => Promise<T>): Promise<T> {
  initialized ??= AccountWriteLock.updateOne({ _id: 'identity' }, { $setOnInsert: { revision: 0 } }, { upsert: true }).exec();
  await initialized;
  return mongoose.connection.transaction(async session => {
    await AccountWriteLock.updateOne({ _id: 'identity' }, { $inc: { revision: 1 } }, { session });
    return write(session);
  });
}
