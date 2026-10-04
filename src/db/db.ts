import Dexie, { type Table } from 'dexie';
import type {
  AuditEntry, Campaign, Chat, Client, Comment, Contract, Funnel, Hook, Idea, LocalRow, Member, Metric, Package, Post, Proposal,
  SettingRow, Snippet, Trend, TrendReport,
} from './types';

/**
 * The on-device database (IndexedDB). This is the source of truth: the app
 * reads and writes here first, so it keeps working with no internet.
 * (Its name differs from JoshWorks POS's, so both apps can share a domain.)
 */
export class CampDB extends Dexie {
  settings!: Table<SettingRow, string>;
  members!: Table<Member, string>;
  posts!: Table<Post, string>;
  comments!: Table<Comment, string>;
  campaigns!: Table<Campaign, string>;
  funnels!: Table<Funnel, string>;
  ideas!: Table<Idea, string>;
  snippets!: Table<Snippet, string>;
  trends!: Table<Trend, string>;
  hooks!: Table<Hook, string>;
  reports!: Table<TrendReport, string>;
  metrics!: Table<Metric, string>;
  clients!: Table<Client, string>;
  packages!: Table<Package, string>;
  proposals!: Table<Proposal, string>;
  contracts!: Table<Contract, string>;
  audit!: Table<AuditEntry, string>;
  // Device-only tables (never synced)
  local!: Table<LocalRow, string>;
  chats!: Table<Chat, string>;

  constructor(name = 'jworks-campaigns') {
    super(name);
    this.version(1).stores({
      settings: 'id, updatedAt, _sync',
      members: 'id, appRole, email, updatedAt, _sync',
      posts: 'id, date, status, clientId, campaignId, updatedAt, _sync',
      comments: 'id, postId, at, updatedAt, _sync',
      campaigns: 'id, clientId, status, updatedAt, _sync',
      funnels: 'id, clientId, campaignId, updatedAt, _sync',
      ideas: 'id, kind, status, updatedAt, _sync',
      snippets: 'id, kind, updatedAt, _sync',
      trends: 'id, kind, status, updatedAt, _sync',
      hooks: 'id, memberId, practiceDate, updatedAt, _sync',
      reports: 'id, weekOf, updatedAt, _sync',
      metrics: 'id, postId, clientId, date, platform, updatedAt, _sync',
      clients: 'id, stage, updatedAt, _sync',
      packages: 'id, kind, updatedAt, _sync',
      proposals: 'id, clientId, status, updatedAt, _sync',
      contracts: 'id, clientId, status, updatedAt, _sync',
      audit: 'id, at, entity, entityId, updatedAt, _sync',
      local: 'key',
      chats: 'id, updatedAt',
    });
  }
}

export const db = new CampDB();

/** Tables that sync between devices and to the cloud, in upload order. */
export const SYNCED_TABLES = [
  'settings', 'members', 'clients', 'packages', 'campaigns', 'funnels', 'ideas', 'snippets', 'posts', 'comments',
  'trends', 'hooks', 'reports', 'metrics', 'proposals', 'contracts', 'audit',
] as const;
export type SyncedTableName = (typeof SYNCED_TABLES)[number];

/** Money and legal documents: only the owner and managers receive them. */
export const MANAGER_TABLES: readonly SyncedTableName[] = ['packages', 'proposals', 'contracts'];

export function syncedTable(name: SyncedTableName): Table<any, string> {
  return (db as unknown as Record<string, Table<any, string>>)[name];
}

/** Drop tombstones. */
export const alive = <T extends { deleted?: 0 | 1 }>(rows: readonly T[]): T[] => rows.filter((r) => r.deleted !== 1);
