import { Asset } from 'expo-asset';
import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
export function getDatabase() { if (!dbPromise) dbPromise = SQLite.openDatabaseAsync('studytrack.db'); return dbPromise; }

function hashPassword(value: string) {
  // Hash determinístico para não armazenar a senha em texto puro no SQLite local.
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let round = 0; round < 120; round++) {
    for (let i = 0; i < value.length; i++) {
      const c = value.charCodeAt(i) + round;
      h1 ^= c;
      h1 = Math.imul(h1, 16777619);
      h2 ^= (c * 31 + i);
      h2 = Math.imul(h2, 2246822519);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 13), 1274126177);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 3266489917);
  }
  return `${(h1 >>> 0).toString(16).padStart(8,'0')}${(h2 >>> 0).toString(16).padStart(8,'0')}`;
}

export type UsuarioDb = { id:string; nome:string; email:string; senha_hash:string; nivel:string|null; idade:string|null; sexo:string|null; avatar:string|null };

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
    CREATE TABLE IF NOT EXISTS sync_outbox (id INTEGER PRIMARY KEY AUTOINCREMENT, tabela TEXT NOT NULL, acao TEXT NOT NULL, id_local TEXT NOT NULL, tentativas INTEGER NOT NULL DEFAULT 0, criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS sync_map (tabela TEXT NOT NULL, id_local TEXT NOT NULL, id_remoto INTEGER NOT NULL, PRIMARY KEY (tabela, id_local));
  `);
  for (const sql of [
    'ALTER TABLE registro_estudo ADD COLUMN fotos TEXT',
    'ALTER TABLE meta ADD COLUMN observacao TEXT',
    'ALTER TABLE meta ADD COLUMN foto TEXT',
  ]) { try { await db.execAsync(sql); } catch {} }
  return db;
}

export async function registerUsuario(nome:string,email:string,senha:string,nivel:string,idade:string,sexo:string) {
  const db = await initDatabase();
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await db.getFirstAsync<{id:string}>('SELECT id FROM usuario WHERE email=?', normalizedEmail);
  if (existing) throw new Error('Este e-mail já está cadastrado.');
  const id = `usr-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  await db.runAsync('INSERT INTO usuario(id,nome,email,senha_hash,nivel,idade,sexo,criado_em) VALUES(?,?,?,?,?,?,?,?)', id, nome.trim(), normalizedEmail, hashPassword(senha), nivel || null, idade || null, sexo || null, new Date().toISOString());
  await db.runAsync('INSERT INTO configuracao(chave,valor) VALUES(?,?) ON CONFLICT(chave) DO UPDATE SET valor=excluded.valor', 'sessao_usuario_id', id);
  return (await db.getFirstAsync<UsuarioDb>('SELECT * FROM usuario WHERE id=?', id))!;
}

export async function loginUsuario(email:string,senha:string) {
  const db = await initDatabase();
  const normalizedEmail = email.trim().toLowerCase();
  const usuario = await db.getFirstAsync<UsuarioDb>('SELECT * FROM usuario WHERE email=? AND senha_hash=?', normalizedEmail, hashPassword(senha));
  if (!usuario) throw new Error('E-mail ou senha inválidos.');
  await db.runAsync('INSERT INTO configuracao(chave,valor) VALUES(?,?) ON CONFLICT(chave) DO UPDATE SET valor=excluded.valor', 'sessao_usuario_id', usuario.id);
  return usuario;
}

export async function getSessaoUsuario() {
  const db = await initDatabase();
  const setting = await db.getFirstAsync<{valor:string}>('SELECT valor FROM configuracao WHERE chave=?','sessao_usuario_id');
  if (!setting?.valor) return null;
  return db.getFirstAsync<UsuarioDb>('SELECT * FROM usuario WHERE id=?', setting.valor);
}

export async function logoutUsuario() {
  const db = await initDatabase();
  await db.runAsync('DELETE FROM configuracao WHERE chave=?','sessao_usuario_id');
}

export async function updateUsuario(id:string, data:Partial<Pick<UsuarioDb,'nome'|'email'|'nivel'|'idade'|'sexo'|'avatar'>>) {
  const db = await initDatabase();
  if (data.email) {
    const normalizedEmail=data.email.trim().toLowerCase();
    const other=await db.getFirstAsync<{id:string}>('SELECT id FROM usuario WHERE email=? AND id<>?',normalizedEmail,id);
    if(other) throw new Error('Este e-mail já está em uso.');
  }
  await db.runAsync(`UPDATE usuario SET nome=COALESCE(?,nome), email=COALESCE(?,email), nivel=COALESCE(?,nivel), idade=COALESCE(?,idade), sexo=COALESCE(?,sexo), avatar=COALESCE(?,avatar) WHERE id=?`, data.nome??null, data.email?data.email.trim().toLowerCase():null, data.nivel??null, data.idade??null, data.sexo??null, data.avatar??null, id);
  return (await db.getFirstAsync<UsuarioDb>('SELECT * FROM usuario WHERE id=?',id))!;
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
    const ss = await db.getFirstAsync<{ total:number }>('SELECT COUNT(*) total FROM simulado');
    if ((ss?.total ?? 0) === 0) {
      const bundled = [
        ['sim-mat','Simulado ENEM — Matemática','Matemática',require('../../assets/simulados/simulado-matematica.pdf')],
        ['sim-fis','Simulado ENEM — Física','Física',require('../../assets/simulados/simulado-fisica.pdf')],
        ['sim-his','Simulado — História','História',require('../../assets/simulados/simulado-historia.pdf')],
      ] as const;
      for (const [id,titulo,materia,moduleId] of bundled) {
        const asset=Asset.fromModule(moduleId); await asset.downloadAsync();
        await db.runAsync('INSERT INTO simulado(id,titulo,materia,arquivo,data_adicionado) VALUES(?,?,?,?,?)',id,titulo,materia,asset.localUri||asset.uri,new Date().toISOString());
      }
    }
  });
}
export async function getSetting(chave:string){ const db=await initDatabase(); const r=await db.getFirstAsync<{valor:string}>('SELECT valor FROM configuracao WHERE chave=?',chave); return r?.valor ?? null; }
export async function setSetting(chave:string,valor:string){ const db=await initDatabase(); await db.runAsync('INSERT INTO configuracao(chave,valor) VALUES(?,?) ON CONFLICT(chave) DO UPDATE SET valor=excluded.valor',chave,valor); }
