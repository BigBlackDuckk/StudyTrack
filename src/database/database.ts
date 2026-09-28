import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
export function getDatabase() { if (!dbPromise) dbPromise = SQLite.openDatabaseAsync('studytrack.db'); return dbPromise; }

export async function initDatabase() {
  const db = await getDatabase();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS usuario (id TEXT PRIMARY KEY NOT NULL, nome TEXT NOT NULL, email TEXT NOT NULL UNIQUE, senha_hash TEXT NOT NULL, nivel TEXT, idade TEXT, sexo TEXT, avatar TEXT, criado_em TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS disciplina (id TEXT PRIMARY KEY NOT NULL, nome TEXT NOT NULL, area TEXT NOT NULL, nota REAL NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS conteudo (id TEXT PRIMARY KEY NOT NULL, disciplina_id TEXT NOT NULL, nome TEXT NOT NULL, estudado INTEGER NOT NULL DEFAULT 0, FOREIGN KEY (disciplina_id) REFERENCES disciplina(id) ON DELETE CASCADE);
  `);
  return db;
}

