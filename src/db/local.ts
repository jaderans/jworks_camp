import { db } from './db';
import { uid } from '../lib/ids';

/** Values that belong to this device only (never synced). */

export async function getLocal<T>(key: string, fallback: T): Promise<T> {
  const row = await db.local.get(key);
  return row === undefined ? fallback : (row.value as T);
}

export async function setLocal(key: string, value: unknown): Promise<void> {
  await db.local.put({ key, value });
}

export interface DeviceInfo {
  deviceId: string;
  name: string;
}

export async function ensureDevice(): Promise<DeviceInfo> {
  const existing = await getLocal<DeviceInfo | null>('device', null);
  if (existing?.deviceId) return existing;
  const info: DeviceInfo = { deviceId: uid(), name: 'This device' };
  await setLocal('device', info);
  return info;
}

export async function updateDevice(changes: Partial<DeviceInfo>): Promise<DeviceInfo> {
  const cur = await ensureDevice();
  const next = { ...cur, ...changes };
  await setLocal('device', next);
  return next;
}
