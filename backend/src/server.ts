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

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const port = Number(process.env.PORT) || 3333;

// Resolve os caminhos a partir do arquivo, e não do diretório atual, para que o
// servidor suba corretamente tanto em `npm start` (raiz) quanto em `backend/`.
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const databaseDir = path.resolve(backendRoot, 'database');

const dbFile = process.env.DATABASE_FILE || path.join(databaseDir, 'studytrack.db');
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

const db = new DatabaseSync(dbFile);
db.exec('PRAGMA foreign_keys = ON;');

const schemaPath = path.join(databaseDir, 'schema.sql');
if (!fs.existsSync(schemaPath)) {
  throw new Error(`Arquivo de schema não encontrado em: ${schemaPath}`);
}

db.exec(fs.readFileSync(schemaPath, 'utf8'));

for (const sql of [
  'ALTER TABLE usuario ADD COLUMN idade TEXT',
  'ALTER TABLE usuario ADD COLUMN sexo TEXT'
]) {
  try {
    db.exec(sql);
  } catch {}
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password: string, stored: string) {
  if (!stored.includes(':')) return stored === password;
  const [salt, expected] = stored.split(':');
  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

function run(sql: string, params: unknown[] = []) {
  return db.prepare(sql).run(...params);
}
function get<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  return db.prepare(sql).get(...params) as T | undefined;
}
function all<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  return db.prepare(sql).all(...params) as T[];
}
function id(value: unknown) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new Error('ID inválido');
  return n;
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'StudyTrack API', database: 'SQLite + SQL puro' }));

app.post('/auth/register', (req, res) => {
  try {
    const { nome, email, senha, nivelEscolar, idade, sexo } = req.body;
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    if (!nome || !normalizedEmail || !senha) return res.status(400).json({ error: 'nome, email e senha são obrigatórios' });
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return res.status(400).json({ error: 'Informe um e-mail válido' });
    if (String(senha).length < 6) return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres' });
    const result = run('INSERT INTO usuario (nome,email,senha,nivel_escolar,idade,sexo) VALUES (?,?,?,?,?,?)', [String(nome).trim(), normalizedEmail, hashPassword(String(senha)), nivelEscolar ?? null, idade ?? null, sexo ?? null]);
    const usuario = get('SELECT id,nome,email,nivel_escolar AS nivelEscolar,idade,sexo,foto FROM usuario WHERE id=?', [result.lastInsertRowid]);
    res.status(201).json(usuario);
  } catch {
    res.status(400).json({ error: 'Não foi possível criar a conta. O e-mail pode já estar cadastrado.' });
  }
});

app.post('/auth/login', (req, res) => {
  const { email, senha } = req.body;
  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  const usuario = get<any>('SELECT * FROM usuario WHERE email=?', [normalizedEmail]);
  if (!usuario || !verifyPassword(String(senha ?? ''), String(usuario.senha))) return res.status(401).json({ error: 'E-mail ou senha inválidos' });
  if (!String(usuario.senha).includes(':')) run('UPDATE usuario SET senha=? WHERE id=?', [hashPassword(String(senha)), usuario.id]);
  res.json({id:usuario.id,nome:usuario.nome,email:usuario.email,nivelEscolar:usuario.nivel_escolar,idade:usuario.idade,sexo:usuario.sexo,foto:usuario.foto});
});

app.get('/disciplinas', (req, res) => {
  const usuarioId = id(req.query.usuarioId);
  const disciplinas = all('SELECT * FROM disciplina WHERE usuario_id=? ORDER BY nome', [usuarioId]);
  const conteudos = all('SELECT * FROM conteudo WHERE disciplina_id IN (SELECT id FROM disciplina WHERE usuario_id=?) ORDER BY nome', [usuarioId]);
  res.json(disciplinas.map((d: any) => ({ ...d, usuario_id: undefined, conteudos: conteudos.filter((c: any) => c.disciplina_id === d.id) })));
});

app.post('/disciplinas', (req, res) => {
  try {
    const { usuarioId, nome, area, nota = 0 } = req.body;
    const result = run('INSERT INTO disciplina (usuario_id,nome,area,nota) VALUES (?,?,?,?)', [id(usuarioId), nome, area, Number(nota)]);
    res.status(201).json(get('SELECT * FROM disciplina WHERE id=?', [result.lastInsertRowid]));
  } catch { res.status(400).json({ error: 'Não foi possível criar a disciplina' }); }
});

app.put('/disciplinas/:id', (req, res) => {
  const { nome, area, nota } = req.body;
  run('UPDATE disciplina SET nome=?,area=?,nota=? WHERE id=?', [nome, area, Number(nota ?? 0), id(req.params.id)]);
  res.json(get('SELECT * FROM disciplina WHERE id=?', [id(req.params.id)]));
});

app.delete('/disciplinas/:id', (req, res) => {
  run('DELETE FROM disciplina WHERE id=?', [id(req.params.id)]);
  res.status(204).end();
});

app.get('/conteudos', (req, res) => res.json(all('SELECT * FROM conteudo WHERE disciplina_id=? ORDER BY nome', [id(req.query.disciplinaId)])));
app.post('/conteudos', (req, res) => {
  const { disciplinaId, nome } = req.body;
  const result = run('INSERT INTO conteudo (disciplina_id,nome) VALUES (?,?)', [id(disciplinaId), nome]);
  res.status(201).json(get('SELECT * FROM conteudo WHERE id=?', [result.lastInsertRowid]));
});
app.put('/conteudos/:id', (req, res) => {
  run('UPDATE conteudo SET nome=?,estudado=? WHERE id=?', [req.body.nome, req.body.estudado ? 1 : 0, id(req.params.id)]);
  res.json(get('SELECT * FROM conteudo WHERE id=?', [id(req.params.id)]));
});
app.delete('/conteudos/:id', (req, res) => { run('DELETE FROM conteudo WHERE id=?', [id(req.params.id)]); res.status(204).end(); });

app.get('/registros', (req, res) => res.json(all('SELECT r.*, d.nome AS disciplina_nome, c.nome AS conteudo_nome FROM registro_estudo r JOIN disciplina d ON d.id=r.disciplina_id LEFT JOIN conteudo c ON c.id=r.conteudo_id WHERE r.usuario_id=? ORDER BY r.data DESC', [id(req.query.usuarioId)])));
app.post('/registros', (req, res) => {
  const { usuarioId, disciplinaId, conteudoId, data, duracao = 0, observacao } = req.body;
  const result = run('INSERT INTO registro_estudo (usuario_id,disciplina_id,conteudo_id,data,duracao,observacao) VALUES (?,?,?,?,?,?)', [id(usuarioId), id(disciplinaId), conteudoId ? id(conteudoId) : null, data ?? new Date().toISOString(), Number(duracao), observacao ?? null]);
  res.status(201).json(get('SELECT * FROM registro_estudo WHERE id=?', [result.lastInsertRowid]));
});
app.delete('/registros/:id', (req, res) => { run('DELETE FROM registro_estudo WHERE id=?', [id(req.params.id)]); res.status(204).end(); });

app.get('/cronograma', (req, res) => res.json(all('SELECT c.*, d.nome AS disciplina_nome FROM cronograma c JOIN disciplina d ON d.id=c.disciplina_id WHERE c.usuario_id=? ORDER BY c.data,c.inicio', [id(req.query.usuarioId)])));
app.post('/cronograma', (req, res) => {
  const { usuarioId, disciplinaId, data, inicio, fim, titulo, observacao } = req.body;
  const result = run('INSERT INTO cronograma (usuario_id,disciplina_id,data,inicio,fim,titulo,observacao) VALUES (?,?,?,?,?,?,?)', [id(usuarioId), id(disciplinaId), data, inicio, fim, titulo, observacao ?? null]);
  res.status(201).json(get('SELECT * FROM cronograma WHERE id=?', [result.lastInsertRowid]));
});
app.put('/cronograma/:id', (req, res) => {
  const { disciplinaId, data, inicio, fim, titulo, observacao, concluido } = req.body;
  run('UPDATE cronograma SET disciplina_id=?,data=?,inicio=?,fim=?,titulo=?,observacao=?,concluido=? WHERE id=?', [id(disciplinaId), data, inicio, fim, titulo, observacao ?? null, concluido ? 1 : 0, id(req.params.id)]);
  res.json(get('SELECT * FROM cronograma WHERE id=?', [id(req.params.id)]));
});
app.delete('/cronograma/:id', (req, res) => { run('DELETE FROM cronograma WHERE id=?', [id(req.params.id)]); res.status(204).end(); });

app.get('/metas', (req, res) => res.json(all('SELECT * FROM meta WHERE usuario_id=? ORDER BY id DESC', [id(req.query.usuarioId)])));
app.post('/metas', (req, res) => {
  const { usuarioId, texto, observacao } = req.body;
  const result = run('INSERT INTO meta (usuario_id,texto,observacao) VALUES (?,?,?)', [id(usuarioId), texto, observacao ?? null]);
  res.status(201).json(get('SELECT * FROM meta WHERE id=?', [result.lastInsertRowid]));
});
app.put('/metas/:id', (req, res) => { run('UPDATE meta SET texto=?,observacao=?,feita=? WHERE id=?', [req.body.texto, req.body.observacao ?? null, req.body.feita ? 1 : 0, id(req.params.id)]); res.json(get('SELECT * FROM meta WHERE id=?', [id(req.params.id)])); });
app.delete('/metas/:id', (req, res) => { run('DELETE FROM meta WHERE id=?', [id(req.params.id)]); res.status(204).end(); });

app.get('/simulados', (req, res) => res.json(all('SELECT s.*, d.nome AS disciplina_nome FROM simulado s LEFT JOIN disciplina d ON d.id=s.disciplina_id WHERE s.usuario_id=? ORDER BY s.data_adicionado DESC', [id(req.query.usuarioId)])));
app.post('/simulados', (req, res) => { const { usuarioId, disciplinaId, titulo, arquivo } = req.body; const result = run('INSERT INTO simulado (usuario_id,disciplina_id,titulo,arquivo) VALUES (?,?,?,?)', [id(usuarioId), disciplinaId ? id(disciplinaId) : null, titulo, arquivo]); res.status(201).json(get('SELECT * FROM simulado WHERE id=?', [result.lastInsertRowid])); });
app.delete('/simulados/:id', (req, res) => { run('DELETE FROM simulado WHERE id=?', [id(req.params.id)]); res.status(204).end(); });

app.patch('/usuarios/:id', (req, res) => {
  const { nome, email, foto, nivelEscolar, idade, sexo } = req.body;
  run('UPDATE usuario SET nome=COALESCE(?,nome),email=COALESCE(?,email),foto=COALESCE(?,foto),nivel_escolar=COALESCE(?,nivel_escolar),idade=COALESCE(?,idade),sexo=COALESCE(?,sexo) WHERE id=?', [nome ?? null, email ?? null, foto ?? null, nivelEscolar ?? null, idade ?? null, sexo ?? null, id(req.params.id)]);
  res.json(get('SELECT id,nome,email,foto,nivel_escolar AS nivelEscolar,idade,sexo FROM usuario WHERE id=?', [id(req.params.id)]));
});

app.listen(port, () => console.log(`StudyTrack API SQL em http://localhost:${port}`));
