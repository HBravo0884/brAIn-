import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (SUPABASE_URL && SUPABASE_ANON)
  ? createClient(SUPABASE_URL, SUPABASE_ANON)
  : null;

export const isSupabaseEnabled = () => !!supabase;

// ── Sync helpers ──────────────────────────────────────────────────────────────

/**
 * Upsert all items in an entity array to Supabase.
 * Each item is stored as { id, data: item, updated_at }.
 */
export const syncEntityToSupabase = async (tableName, items) => {
  if (!supabase || !items?.length) return;
  try {
    const rows = items.map(item => ({
      id: item.id,
      data: item,
      updated_at: item.updatedAt || new Date().toISOString(),
    }));
    const { error } = await supabase.from(tableName).upsert(rows, { onConflict: 'id' });
    if (error) console.warn(`Supabase sync error (${tableName}):`, error.message);
  } catch (e) {
    console.warn(`Supabase sync failed (${tableName}):`, e.message);
  }
};

/**
 * Pull all rows from a Supabase table, return array of the stored entity objects.
 */
export const pullEntityFromSupabase = async (tableName) => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from(tableName).select('data, updated_at');
    if (error) { console.warn(`Supabase pull error (${tableName}):`, error.message); return null; }
    return (data || []).map(row => row.data);
  } catch (e) {
    console.warn(`Supabase pull failed (${tableName}):`, e.message);
    return null;
  }
};

// Entity → table name map
const ENTITY_TABLES = {
  grants:                 'grants',
  budgets:                'budgets',
  tasks:                  'tasks',
  meetings:               'meetings',
  todos:                  'todos',
  paymentRequests:        'payment_requests',
  travelRequests:         'travel_requests',
  giftCardDistributions:  'gift_card_distributions',
  documents:              'documents',
  knowledgeDocs:          'knowledge_docs',
  personnel:              'personnel',
  templates:              'templates',
  taskTypes:              'task_types',
};

/**
 * Sync a single named entity (key from ENTITY_TABLES) to Supabase.
 */
export const syncEntity = (entityKey, items) =>
  syncEntityToSupabase(ENTITY_TABLES[entityKey], items);

/**
 * Pull all entities from Supabase. Returns object keyed by entityKey.
 * Returns null values for tables that fail or are empty.
 */
export const pullAllFromSupabase = async () => {
  if (!supabase) return null;
  const entries = await Promise.all(
    Object.entries(ENTITY_TABLES).map(async ([key, table]) => {
      const data = await pullEntityFromSupabase(table);
      return [key, data];
    })
  );
  // Also pull students
  const students = await pullEntityFromSupabase('students');
  return { ...Object.fromEntries(entries), students };
};

/**
 * Merge Supabase records into a local array.
 * Supabase record wins if its updatedAt is newer.
 */
export const mergeWithSupabase = (local, remote) => {
  if (!remote?.length) return local;
  const localMap = new Map((local || []).map(item => [item.id, item]));
  remote.forEach(remoteItem => {
    const localItem = localMap.get(remoteItem.id);
    if (!localItem || (remoteItem.updatedAt > (localItem.updatedAt || ''))) {
      localMap.set(remoteItem.id, remoteItem);
    }
  });
  return Array.from(localMap.values());
};

/**
 * Sync settings object to Supabase.
 */
export const syncSettings = async (settings) => {
  if (!supabase) return;
  try {
    await supabase.from('settings').upsert(
      { id: 'default', data: settings, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
  } catch (e) {
    console.warn('Supabase settings sync failed:', e.message);
  }
};

/**
 * Pull settings from Supabase.
 */
export const pullSettings = async () => {
  if (!supabase) return null;
  try {
    const { data } = await supabase.from('settings').select('data').eq('id', 'default').single();
    return data?.data || null;
  } catch (e) {
    return null;
  }
};
