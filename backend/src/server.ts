// Type checking is disabled for this runtime entry point because its project
// dependencies and Node type declarations are provided by the deployment setup.
// @ts-nocheck
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import mysql from 'mysql2/promise';

// Carrega backend/.env manualmente (sem dependência extra). Não sobrescreve
// variáveis que já estão definidas no ambiente.
try {
  const envFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m || line.trim().startsWith('#')) continue;
      const value = m[2].replace(/^["']|["']$/g, '');
      if (!(m[1] in process.env)) process.env[m[1]] = value;
    }
  }
} catch { /* sem .env, segue com o ambiente */ }


const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const port = Number(process.env.PORT) || 3333;

// Resolve os caminhos a partir do arquivo, e nao do diretorio atual, para que o
// servidor suba corretamente tanto em `npm start` (raiz) quanto em `backend/`.
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const databaseDir = path.resolve(backendRoot, 'database');

// ---------------------------------------------------------------------------
// Camada de banco: MySQL (quando configurado via .env) ou SQLite (fallback).
// No MySQL os placeholders tambem sao `?`, entao todo o SQL funciona nos dois
// dialetos. A unica diferenca e a execucao (assincrona no mysql2).
// ---------------------------------------------------------------------------
const useMysql =
  process.env.DB_CLIENT === 'mysql' ||
  Boolean(process.env.MYSQL_HOST || process.env.MYSQL_URL);

let sqliteDb = null;
let mysqlPool = null;

async function initDatabase() {
  if (useMysql) {
    const url = process.env.MYSQL_URL ? new URL(process.env.MYSQL_URL) : null;
    mysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST || url?.hostname || 'localhost',
      port: Number(process.env.MYSQL_PORT || url?.port || 3306),
      user: process.env.MYSQL_USER || url?.username || 'root',
      password: process.env.MYSQL_PASSWORD || url?.password || '',
      database: process.env.MYSQL_DATABASE || url?.pathname?.slice(1) || 'studytrack',
      waitForConnections: true,
      connectionLimit: 10,
      multipleStatements: true,
    });

    // Garante que o schema exista (CREATE TABLE IF NOT EXISTS).
    // O MySQL nao aceita `CREATE INDEX IF NOT EXISTS`, entao cada instrucao
    // roda isolada e erros de "ja existe" sao ignorados.
    const schemaFile = path.join(databaseDir, 'schema.mysql.sql');
    const conn = await mysqlPool.getConnection();
    try {
      const statements = fs
        .readFileSync(schemaFile, 'utf8')
        .split(/;\s*(?:\r?\n|$)/)
        .map((s) => s.trim())
        .filter(Boolean);
      for (const statement of statements) {
        try { await conn.query(statement); } catch (e) {
          if (!/already exists|duplicate/i.test(String(e.message))) throw e;
        }
      }
      // Migracao leve: colunas extras que podem faltar em bancos antigos.
      for (const sql of [
        'ALTER TABLE usuario ADD COLUMN idade VARCHAR(20)',
        'ALTER TABLE usuario ADD COLUMN sexo VARCHAR(20)',
      ]) {
        try { await conn.query(sql); } catch { /* coluna ja existe */ }
      }
      // Retro-migração N-para-M: vínculos 1-N legados viram linhas nas junctions.
      // INSERT IGNORE (MySQL) garante idempotência em bancos já migrados.
      for (const sql of [
        'INSERT IGNORE INTO conteudo_disciplina (conteudo_id, disciplina_id) SELECT id, disciplina_id FROM conteudo',
        'INSERT IGNORE INTO registro_conteudo (registro_id, conteudo_id) SELECT id, conteudo_id FROM registro_estudo WHERE conteudo_id IS NOT NULL',
        'INSERT IGNORE INTO simulado_disciplina (simulado_id, disciplina_id) SELECT id, disciplina_id FROM simulado WHERE disciplina_id IS NOT NULL',
      ]) {
        try { await conn.query(sql); } catch { /* tabela legada sem a coluna — ignora */ }
      }
      console.log(`[DB] Conectado ao MySQL (banco: ${process.env.MYSQL_DATABASE || 'studytrack'})`);
    } finally {
      conn.release();
    }
    return;
  }

  // Fallback: SQLite local (node:sqlite, nativo do Node 22+).
  const dbFile = process.env.DATABASE_FILE || path.join(databaseDir, 'studytrack.db');
  fs.mkdirSync(path.dirname(dbFile), { recursive: true });
  sqliteDb = new DatabaseSync(dbFile);
  sqliteDb.exec('PRAGMA foreign_keys = ON;');
  const schemaPath = path.join(databaseDir, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Arquivo de schema nao encontrado em: ${schemaPath}`);
  }
  sqliteDb.exec(fs.readFileSync(schemaPath, 'utf8'));
  for (const sql of [
    'ALTER TABLE usuario ADD COLUMN idade TEXT',
    'ALTER TABLE usuario ADD COLUMN sexo TEXT',
  ]) {
    try { sqliteDb.exec(sql); } catch { /* coluna ja existe */ }
  }
  for (const sql of [
    'INSERT OR IGNORE INTO conteudo_disciplina (conteudo_id, disciplina_id) SELECT id, disciplina_id FROM conteudo',
    'INSERT OR IGNORE INTO registro_conteudo (registro_id, conteudo_id) SELECT id, conteudo_id FROM registro_estudo WHERE conteudo_id IS NOT NULL',
    'INSERT OR IGNORE INTO simulado_disciplina (simulado_id, disciplina_id) SELECT id, disciplina_id FROM simulado WHERE disciplina_id IS NOT NULL',
  ]) {
    try { sqliteDb.exec(sql); } catch { /* banco legado sem a coluna — ignora */ }
  }
  console.log(`[DB] Conectado ao SQLite em ${dbFile}`);
}

// Helpers unificados: mesmo comportamento nos dois dialetos.
async function run(sql, params = []) {
  if (mysqlPool) {
    const [result] = await mysqlPool.query(sql, params);
    return { lastInsertRowid: result.insertId, changes: result.affectedRows };
  }
  return sqliteDb.prepare(sql).run(...params);
}
async function get(sql, params = []) {
  if (mysqlPool) {
    const [rows] = await mysqlPool.query(sql, params);
    return rows[0];
  }
  return sqliteDb.prepare(sql).get(...params);
}
async function all(sql, params = []) {
  if (mysqlPool) {
    const [rows] = await mysqlPool.query(sql, params);
    return rows;
  }
  return sqliteDb.prepare(sql).all(...params);
}

function id(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new Error('ID invalido');
  return n;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  if (!stored.includes(':')) return stored === password;
  const [salt, expected] = stored.split(':');
  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

// ---------------------------------------------------------------------------
// Rotas da API (assincronas para funcionar nos dois dialetos de banco)
// ---------------------------------------------------------------------------
app.get('/health', async (_req, res) =>
  res.json({ ok: true, service: 'StudyTrack API', database: useMysql ? 'MySQL' : 'SQLite' }));

app.post('/auth/register', async (req, res) => {
  try {
    const { nome, email, senha, nivelEscolar, idade, sexo } = req.body;
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    if (!nome || !normalizedEmail || !senha) return res.status(400).json({ error: 'nome, email e senha sao obrigatorios' });
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return res.status(400).json({ error: 'Informe um e-mail valido' });
    if (String(senha).length < 6) return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres' });
    const result = await run('INSERT INTO usuario (nome,email,senha,nivel_escolar,idade,sexo) VALUES (?,?,?,?,?,?)', [String(nome).trim(), normalizedEmail, hashPassword(String(senha)), nivelEscolar ?? null, idade ?? null, sexo ?? null]);
    const usuario = await get('SELECT id,nome,email,nivel_escolar AS nivelEscolar,idade,sexo,foto FROM usuario WHERE id=?', [result.lastInsertRowid]);
    res.status(201).json(usuario);
  } catch {
    res.status(400).json({ error: 'Nao foi possivel criar a conta. O e-mail pode ja estar cadastrado.' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, senha } = req.body;
  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  const usuario = await get('SELECT * FROM usuario WHERE email=?', [normalizedEmail]);
  if (!usuario || !verifyPassword(String(senha ?? ''), String(usuario.senha))) return res.status(401).json({ error: 'E-mail ou senha invalidos' });
  if (!String(usuario.senha).includes(':')) await run('UPDATE usuario SET senha=? WHERE id=?', [hashPassword(String(senha)), usuario.id]);
  res.json({ id: usuario.id, nome: usuario.nome, email: usuario.email, nivelEscolar: usuario.nivel_escolar, idade: usuario.idade, sexo: usuario.sexo, foto: usuario.foto });
});

app.get('/disciplinas', async (req, res) => {
  const usuarioId = id(req.query.usuarioId);
  const disciplinas = await all('SELECT * FROM disciplina WHERE usuario_id=? ORDER BY nome', [usuarioId]);
  const conteudos = await all('SELECT * FROM conteudo WHERE disciplina_id IN (SELECT id FROM disciplina WHERE usuario_id=?) ORDER BY nome', [usuarioId]);
  res.json(disciplinas.map((d) => ({ ...d, usuario_id: undefined, conteudos: conteudos.filter((c) => c.disciplina_id === d.id) })));
});

app.post('/disciplinas', async (req, res) => {
  try {
    const { usuarioId, nome, area, nota = 0 } = req.body;
    const result = await run('INSERT INTO disciplina (usuario_id,nome,area,nota) VALUES (?,?,?,?)', [id(usuarioId), nome, area, Number(nota)]);
    res.status(201).json(await get('SELECT * FROM disciplina WHERE id=?', [result.lastInsertRowid]));
  } catch { res.status(400).json({ error: 'Nao foi possivel criar a disciplina' }); }
});

app.put('/disciplinas/:id', async (req, res) => {
  const { nome, area, nota } = req.body;
  await run('UPDATE disciplina SET nome=?,area=?,nota=? WHERE id=?', [nome, area, Number(nota ?? 0), id(req.params.id)]);
  res.json(await get('SELECT * FROM disciplina WHERE id=?', [id(req.params.id)]));
});

app.delete('/disciplinas/:id', async (req, res) => {
  await run('DELETE FROM disciplina WHERE id=?', [id(req.params.id)]);
  res.status(204).end();
});

app.get('/conteudos', async (req, res) => res.json(await all('SELECT * FROM conteudo WHERE disciplina_id=? ORDER BY nome', [id(req.query.disciplinaId)])));
app.post('/conteudos', async (req, res) => {
  const { disciplinaId, nome } = req.body;
  const result = await run('INSERT INTO conteudo (disciplina_id,nome) VALUES (?,?)', [id(disciplinaId), nome]);
  res.status(201).json(await get('SELECT * FROM conteudo WHERE id=?', [result.lastInsertRowid]));
});
app.put('/conteudos/:id', async (req, res) => { await run('UPDATE conteudo SET estudado=? WHERE id=?', [req.body.estudado ? 1 : 0, id(req.params.id)]); res.json(await get('SELECT * FROM conteudo WHERE id=?', [id(req.params.id)])); });
app.delete('/conteudos/:id', async (req, res) => { await run('DELETE FROM conteudo WHERE id=?', [id(req.params.id)]); res.status(204).end(); });

app.get('/registros', async (req, res) => res.json(await all('SELECT r.*, d.nome AS disciplina_nome FROM registro_estudo r JOIN disciplina d ON d.id=r.disciplina_id WHERE r.usuario_id=? ORDER BY r.data DESC', [id(req.query.usuarioId)])));
app.post('/registros', async (req, res) => {
  const { usuarioId, disciplinaId, conteudoId, duracao, observacao } = req.body;
  const result = await run('INSERT INTO registro_estudo (usuario_id,disciplina_id,conteudo_id,data,duracao,observacao) VALUES (?,?,?,?,?,?)', [id(usuarioId), id(disciplinaId), conteudoId ? id(conteudoId) : null, new Date().toISOString(), Number(duracao), observacao ?? null]);
  res.status(201).json(await get('SELECT * FROM registro_estudo WHERE id=?', [result.lastInsertRowid]));
});
app.delete('/registros/:id', async (req, res) => { await run('DELETE FROM registro_estudo WHERE id=?', [id(req.params.id)]); res.status(204).end(); });

app.get('/cronograma', async (req, res) => res.json(await all('SELECT c.*, d.nome AS disciplina_nome FROM cronograma c JOIN disciplina d ON d.id=c.disciplina_id WHERE c.usuario_id=? ORDER BY c.data,c.inicio', [id(req.query.usuarioId)])));
app.post('/cronograma', async (req, res) => {
  const { usuarioId, disciplinaId, data, inicio, fim, titulo, observacao } = req.body;
  const result = await run('INSERT INTO cronograma (usuario_id,disciplina_id,data,inicio,fim,titulo,observacao) VALUES (?,?,?,?,?,?,?)', [id(usuarioId), id(disciplinaId), data, inicio, fim, titulo, observacao ?? null]);
  res.status(201).json(await get('SELECT * FROM cronograma WHERE id=?', [result.lastInsertRowid]));
});
app.put('/cronograma/:id', async (req, res) => {
  const { disciplinaId, data, inicio, fim, titulo, observacao, concluido } = req.body;
  await run('UPDATE cronograma SET disciplina_id=?,data=?,inicio=?,fim=?,titulo=?,observacao=?,concluido=? WHERE id=?', [id(disciplinaId), data, inicio, fim, titulo, observacao ?? null, concluido ? 1 : 0, id(req.params.id)]);
  res.json(await get('SELECT * FROM cronograma WHERE id=?', [id(req.params.id)]));
});
app.delete('/cronograma/:id', async (req, res) => { await run('DELETE FROM cronograma WHERE id=?', [id(req.params.id)]); res.status(204).end(); });

app.get('/metas', async (req, res) => res.json(await all('SELECT * FROM meta WHERE usuario_id=? ORDER BY id DESC', [id(req.query.usuarioId)])));
app.post('/metas', async (req, res) => {
  const { usuarioId, texto, observacao } = req.body;
  const result = await run('INSERT INTO meta (usuario_id,texto,observacao) VALUES (?,?,?)', [id(usuarioId), texto, observacao ?? null]);
  res.status(201).json(await get('SELECT * FROM meta WHERE id=?', [result.lastInsertRowid]));
});
app.put('/metas/:id', async (req, res) => { await run('UPDATE meta SET texto=?,observacao=?,feita=? WHERE id=?', [req.body.texto, req.body.observacao ?? null, req.body.feita ? 1 : 0, id(req.params.id)]); res.json(await get('SELECT * FROM meta WHERE id=?', [id(req.params.id)])); });
app.delete('/metas/:id', async (req, res) => { await run('DELETE FROM meta WHERE id=?', [id(req.params.id)]); res.status(204).end(); });

app.get('/simulados', async (req, res) => res.json(await all('SELECT s.*, d.nome AS disciplina_nome FROM simulado s LEFT JOIN disciplina d ON d.id=s.disciplina_id WHERE s.usuario_id=? ORDER BY s.data_adicionado DESC', [id(req.query.usuarioId)])));
app.post('/simulados', async (req, res) => { const { usuarioId, disciplinaId, titulo, arquivo } = req.body; const result = await run('INSERT INTO simulado (usuario_id,disciplina_id,titulo,arquivo) VALUES (?,?,?,?)', [id(usuarioId), disciplinaId ? id(disciplinaId) : null, titulo, arquivo]); res.status(201).json(await get('SELECT * FROM simulado WHERE id=?', [result.lastInsertRowid])); });
app.delete('/simulados/:id', async (req, res) => { await run('DELETE FROM simulado WHERE id=?', [id(req.params.id)]); res.status(204).end(); });

app.patch('/usuarios/:id', async (req, res) => {
  const { nome, email, foto, nivelEscolar, idade, sexo } = req.body;
  await run('UPDATE usuario SET nome=COALESCE(?,nome),email=COALESCE(?,email),foto=COALESCE(?,foto),nivel_escolar=COALESCE(?,nivel_escolar),idade=COALESCE(?,idade),sexo=COALESCE(?,sexo) WHERE id=?', [nome ?? null, email ?? null, foto ?? null, nivelEscolar ?? null, idade ?? null, sexo ?? null, id(req.params.id)]);
  res.json(await get('SELECT id,nome,email,foto,nivel_escolar AS nivelEscolar,idade,sexo FROM usuario WHERE id=?', [id(req.params.id)]));
});

// ---------------------------------------------------------------------------
// Endpoints N-para-M (junctions). POST com disciplinaIds/conteudoIds substitui
// todos os vínculos (sincroniza o conjunto); DELETE remove um vínculo.
// ---------------------------------------------------------------------------
function ids(body, key) {
  const raw = body?.[key];
  const list = Array.isArray(raw) ? raw : [];
  return [...new Set(list.map((v) => id(v)))];
}

app.get('/simulados/:id/disciplinas', async (req, res) => {
  res.json(await all('SELECT d.* FROM disciplina d JOIN simulado_disciplina sd ON sd.disciplina_id=d.id WHERE sd.simulado_id=? ORDER BY d.nome', [id(req.params.id)]));
});
app.post('/simulados/:id/disciplinas', async (req, res) => {
  const sid = id(req.params.id);
  const list = ids(req.body, 'disciplinaIds');
  await run('DELETE FROM simulado_disciplina WHERE simulado_id=?', [sid]);
  for (const did of list) {
    try { await run('INSERT INTO simulado_disciplina (simulado_id,disciplina_id) VALUES (?,?)', [sid, did]); } catch { /* duplicado — ignora */ }
  }
  res.json(await all('SELECT d.* FROM disciplina d JOIN simulado_disciplina sd ON sd.disciplina_id=d.id WHERE sd.simulado_id=? ORDER BY d.nome', [sid]));
});
app.delete('/simulados/:id/disciplinas/:disciplinaId', async (req, res) => {
  await run('DELETE FROM simulado_disciplina WHERE simulado_id=? AND disciplina_id=?', [id(req.params.id), id(req.params.disciplinaId)]);
  res.status(204).end();
});
app.get('/disciplinas/:id/simulados', async (req, res) => {
  res.json(await all('SELECT s.* FROM simulado s JOIN simulado_disciplina sd ON sd.simulado_id=s.id WHERE sd.disciplina_id=? ORDER BY s.data_adicionado DESC', [id(req.params.id)]));
});

app.get('/conteudos/:id/disciplinas', async (req, res) => {
  res.json(await all('SELECT d.* FROM disciplina d JOIN conteudo_disciplina cd ON cd.disciplina_id=d.id WHERE cd.conteudo_id=? ORDER BY d.nome', [id(req.params.id)]));
});
app.post('/conteudos/:id/disciplinas', async (req, res) => {
  const cid = id(req.params.id);
  const list = ids(req.body, 'disciplinaIds');
  await run('DELETE FROM conteudo_disciplina WHERE conteudo_id=?', [cid]);
  for (const did of list) {
    try { await run('INSERT INTO conteudo_disciplina (conteudo_id,disciplina_id) VALUES (?,?)', [cid, did]); } catch { /* duplicado — ignora */ }
  }
  res.json(await all('SELECT d.* FROM disciplina d JOIN conteudo_disciplina cd ON cd.disciplina_id=d.id WHERE cd.conteudo_id=? ORDER BY d.nome', [cid]));
});
app.delete('/conteudos/:id/disciplinas/:disciplinaId', async (req, res) => {
  await run('DELETE FROM conteudo_disciplina WHERE conteudo_id=? AND disciplina_id=?', [id(req.params.id), id(req.params.disciplinaId)]);
  res.status(204).end();
});

app.get('/metas/:id/disciplinas', async (req, res) => {
  res.json(await all('SELECT d.* FROM disciplina d JOIN meta_disciplina md ON md.disciplina_id=d.id WHERE md.meta_id=? ORDER BY d.nome', [id(req.params.id)]));
});
app.post('/metas/:id/disciplinas', async (req, res) => {
  const mid = id(req.params.id);
  const list = ids(req.body, 'disciplinaIds');
  await run('DELETE FROM meta_disciplina WHERE meta_id=?', [mid]);
  for (const did of list) {
    try { await run('INSERT INTO meta_disciplina (meta_id,disciplina_id) VALUES (?,?)', [mid, did]); } catch { /* duplicado — ignora */ }
  }
  res.json(await all('SELECT d.* FROM disciplina d JOIN meta_disciplina md ON md.disciplina_id=d.id WHERE md.meta_id=? ORDER BY d.nome', [mid]));
});
app.delete('/metas/:id/disciplinas/:disciplinaId', async (req, res) => {
  await run('DELETE FROM meta_disciplina WHERE meta_id=? AND disciplina_id=?', [id(req.params.id), id(req.params.disciplinaId)]);
  res.status(204).end();
});

app.get('/registros/:id/conteudos', async (req, res) => {
  res.json(await all('SELECT c.* FROM conteudo c JOIN registro_conteudo rc ON rc.conteudo_id=c.id WHERE rc.registro_id=? ORDER BY c.nome', [id(req.params.id)]));
});
app.post('/registros/:id/conteudos', async (req, res) => {
  const rid = id(req.params.id);
  const list = ids(req.body, 'conteudoIds');
  await run('DELETE FROM registro_conteudo WHERE registro_id=?', [rid]);
  for (const cid of list) {
    try { await run('INSERT INTO registro_conteudo (registro_id,conteudo_id) VALUES (?,?)', [rid, cid]); } catch { /* duplicado — ignora */ }
  }
  res.json(await all('SELECT c.* FROM conteudo c JOIN registro_conteudo rc ON rc.conteudo_id=c.id WHERE rc.registro_id=? ORDER BY c.nome', [rid]));
});
app.delete('/registros/:id/conteudos/:conteudoId', async (req, res) => {
  await run('DELETE FROM registro_conteudo WHERE registro_id=? AND conteudo_id=?', [id(req.params.id), id(req.params.conteudoId)]);
  res.status(204).end();
});

// Middleware final de erros (evita crashar o processo em erro nao tratado).
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno no servidor' });
});

initDatabase()
  .then(() => {
    app.listen(port, () => console.log(`StudyTrack API em http://localhost:${port} (${useMysql ? 'MySQL' : 'SQLite'})`));
  })
  .catch((err) => {
    console.error('[DB] Falha ao inicializar o banco:', err.message);
    process.exit(1);
  });


