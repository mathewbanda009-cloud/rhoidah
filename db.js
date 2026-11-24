const fs = require('node:fs');
const path = require('node:path');
const { fileURLToPath } = require('node:url');

const projectRoot = __dirname;
const defaultUrl = 'file:./data/mathew-banda.db';
const seedKey = 'it_support_desk_seed_v1';

function closedError() {
  return Object.assign(new Error('The database connection is closed.'), { code: 'CLIENT_CLOSED' });
}

function localFilename(url) {
  if (url === 'file::memory:') return ':memory:';
  const requestedPath = url.startsWith('file://')
    ? fileURLToPath(url)
    : decodeURIComponent(url.slice('file:'.length));
  // Relative paths always belong to this project, even if Node starts elsewhere.
  const filename = path.resolve(projectRoot, requestedPath);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  return filename;
}

function createDatabase({
  url = process.env.DATABASE_URL || defaultUrl,
  authToken = process.env.DATABASE_AUTH_TOKEN,
} = {}) {
  let client;
  let closed = false;
  let initialization;

  function assertOpen() {
    if (closed) throw closedError();
  }

  function openClient() {
    assertOpen();
    if (client) return client;
    if (typeof url !== 'string' || !url.trim()) {
      throw new Error('DATABASE_URL must be a non-empty string.');
    }

    if (url.startsWith('file:')) {
      // Built-in SQLite avoids loading an external native addon on Windows.
      const { DatabaseSync } = require('node:sqlite');
      const filename = localFilename(url);
      const sqlite = new DatabaseSync(filename);
      try {
        sqlite.exec('PRAGMA busy_timeout = 5000');
        if (filename !== ':memory:') sqlite.exec('PRAGMA journal_mode = WAL');
        sqlite.exec('PRAGMA synchronous = FULL');
      } catch (error) {
        sqlite.close();
        throw error;
      }

      const execute = (statement) => {
        assertOpen();
        const sql = typeof statement === 'string' ? statement : statement.sql;
        const args = typeof statement === 'string' ? [] : statement.args || [];
        const prepared = sqlite.prepare(sql);
        const columns = prepared.columns().map((column) => column.name);
        if (columns.length > 0) {
          const before = sqlite.prepare('SELECT total_changes() AS count').get().count;
          const rows = prepared.all(...args);
          const after = sqlite.prepare('SELECT total_changes() AS count').get().count;
          return { columns, rows, rowsAffected: Number(after - before) };
        }
        const result = prepared.run(...args);
        return { columns, rows: [], rowsAffected: Number(result.changes) };
      };

      client = {
        execute,
        transaction() {
          sqlite.exec('BEGIN IMMEDIATE');
          let active = true;
          return {
            execute,
            executeMultiple(sql) { sqlite.exec(sql); },
            commit() {
              sqlite.exec('COMMIT');
              active = false;
            },
            close() {
              if (!active) return;
              try { sqlite.exec('ROLLBACK'); }
              finally { active = false; }
            },
          };
        },
        close() { sqlite.close(); },
      };
    } else {
      if (!/^(libsql|https|http):\/\//.test(url)) {
        throw new Error('DATABASE_URL must use file:, libsql://, https:// or http://.');
      }
      // The HTTP entry point supports hosted libSQL without its native addon.
      // It is loaded only when a remote connection is actually requested.
      const { createClient } = require('@libsql/client/http');
      client = createClient({ url, ...(authToken ? { authToken } : {}), intMode: 'number' });
    }
    return client;
  }

  async function initializeOnce() {
    const schema = fs.readFileSync(path.join(projectRoot, 'schema.sql'), 'utf8');
    const seed = fs.readFileSync(path.join(projectRoot, 'seed.sql'), 'utf8');
    const transaction = await openClient().transaction('write');
    try {
      await transaction.executeMultiple(schema);
      const marker = await transaction.execute({
        sql: 'SELECT value FROM app_meta WHERE key = ?', args: [seedKey],
      });
      if (marker.rows.length === 0) {
        const existing = await transaction.execute('SELECT COUNT(*) AS count FROM records');
        // Preserve existing records if setup is run against a populated database.
        if (Number(existing.rows[0].count) === 0) await transaction.execute(seed);
        await transaction.execute({
          sql: 'INSERT INTO app_meta (key, value) VALUES (?, ?)', args: [seedKey, 'complete'],
        });
      }
      await transaction.commit();
    } finally {
      // A failed setup is rolled back; successful commits make close a no-op.
      transaction.close();
    }
  }

  return {
    async initialize() {
      assertOpen();
      if (!initialization) {
        initialization = initializeOnce().catch((error) => {
          initialization = undefined;
          throw error;
        });
      }
      return initialization;
    },
    async execute(sql, args = []) {
      const result = await openClient().execute({ sql, args });
      return {
        rows: result.rows.map((row) => Object.fromEntries(
          result.columns.map((column) => [column, row[column]])
        )),
        rowsAffected: result.rowsAffected,
      };
    },
    close() {
      if (closed) return;
      closed = true;
      if (client) client.close();
    },
  };
}

// Creating this wrapper does not open a connection, create files, or seed data.
module.exports = { createDatabase, database: createDatabase() };
