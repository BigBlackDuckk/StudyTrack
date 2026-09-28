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
    CREATE TABLE IF NOT EXISTS registro_estudo (id TEXT PRIMARY KEY NOT NULL, disciplina_id TEXT NOT NULL, conteudo_id TEXT, data TEXT NOT NULL, duracao INTEGER NOT NULL DEFAULT 0, observacao TEXT, fotos TEXT, FOREIGN KEY (disciplina_id) REFERENCES disciplina(id) ON DELETE CASCADE, FOREIGN KEY (conteudo_id) REFERENCES conteudo(id) ON DELETE SET NULL);
    CREATE TABLE IF NOT EXISTS meta (id TEXT PRIMARY KEY NOT NULL, texto TEXT NOT NULL, feita INTEGER NOT NULL DEFAULT 0, observacao TEXT, foto TEXT);
    CREATE TABLE IF NOT EXISTS configuracao (chave TEXT PRIMARY KEY NOT NULL, valor TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS cronograma (id TEXT PRIMARY KEY NOT NULL, disciplina_id TEXT NOT NULL, data TEXT NOT NULL, inicio TEXT NOT NULL, fim TEXT NOT NULL, titulo TEXT NOT NULL, observacao TEXT, concluido INTEGER NOT NULL DEFAULT 0, FOREIGN KEY (disciplina_id) REFERENCES disciplina(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS simulado (id TEXT PRIMARY KEY NOT NULL, titulo TEXT NOT NULL, materia TEXT, arquivo TEXT NOT NULL, data_adicionado TEXT NOT NULL);
  `);
  for (const sql of [
    'ALTER TABLE registro_estudo ADD COLUMN fotos TEXT',
    'ALTER TABLE meta ADD COLUMN observacao TEXT',
    'ALTER TABLE meta ADD COLUMN foto TEXT',
  ]) { try { await db.execAsync(sql); } catch {} }
  return db;
}

export async function seedDatabase() {
  const db = await initDatabase();
  const result = await db.getFirstAsync<{ total:number }>('SELECT COUNT(*) total FROM disciplina');
  await db.withTransactionAsync(async () => {
    if ((result?.total ?? 0) === 0) {
      const ds = [['mat','Matemática','Exatas',74],['fis','Física','Exatas',60],['red','Redação','Humanas',85],['his','História','Humanas',78]] as const;
      for (const d of ds) await db.runAsync('INSERT INTO disciplina(id,nome,area,nota) VALUES(?,?,?,?)',...d);
    }
    const cc = await db.getFirstAsync<{ total:number }>('SELECT COUNT(*) total FROM conteudo');
    if ((cc?.total ?? 0) === 0) for (const c of [['mat-1','mat','Funções',1],['mat-2','mat','Progressão Aritmética',1],['mat-3','mat','Progressão Geométrica',0],['fis-1','fis','Cinemática',1],['fis-2','fis','Dinâmica',0],['red-1','red','Estrutura da redação ENEM',1],['red-2','red','Proposta de intervenção',0],['his-1','his','Revolução Francesa',1],['his-2','his','Era Vargas',0]] as const) await db.runAsync('INSERT INTO conteudo(id,disciplina_id,nome,estudado) VALUES(?,?,?,?)',...c);
  });
}
export async function getSetting(chave:string){ const db=await initDatabase(); const r=await db.getFirstAsync<{valor:string}>('SELECT valor FROM configuracao WHERE chave=?',chave); return r?.valor ?? null; }
export async function setSetting(chave:string,valor:string){ const db=await initDatabase(); await db.runAsync('INSERT INTO configuracao(chave,valor) VALUES(?,?) ON CONFLICT(chave) DO UPDATE SET valor=excluded.valor',chave,valor); }
