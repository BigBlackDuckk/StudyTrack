import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createPool, Pool } from 'mysql2/promise';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============================================================================
// Middleware de log de requisições em tempo real
// Mostra no terminal: data/hora | método | URL | status | tempo de resposta
// ============================================================================
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = () => new Date().toISOString().replace('T', ' ').substring(0, 19);

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp()}] ${req.method.padEnd(7)} ${req.originalUrl.padEnd(30)} ${res.statusCode} - ${duration}ms`);
  });

  next();
});

const port = Number(process.env.PORT) || 3333;

const pool: Pool = createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'studytrack',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function initDb() {
  const schemaPath = path.resolve(process.cwd(), 'database', 'schema.mysql.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    try {
      await pool.query(stmt);
    } catch (e) {
      console.warn('Aviso ao executar statement SQL:', stmt.substring(0, 60).replace(/\s+/g, ' '), '...', (e as Error).message);
    }
  }
  // Garante colunas idade/sexo em bancos criados por versões anteriores
  for (const sql of [
    'ALTER TABLE usuario ADD COLUMN idade VARCHAR(20)',
    'ALTER TABLE usuario ADD COLUMN sexo VARCHAR(20)',
  ]) {
    try {
      await pool.query(sql);
    } catch {}
  }
}

initDb().then(() => console.log('Banco MySQL inicializado com sucesso.')).catch(console.error);

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

async function run(sql: string, params: unknown[] = []) {
  const [result] = await pool.query(sql, params);
  return result as { insertId: number; affectedRows: number };
}
async function get<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  const [rows] = await pool.query(sql, params);
  return (rows as T[])[0] as T | undefined;
}
async function all<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}
function id(value: unknown) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new Error('ID inválido');
  return n;
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'StudyTrack API', database: 'MySQL' }));

app.post('/auth/register', async (req, res) => {
  try {
    const { nome, email, senha, nivelEscolar, idade, sexo } = req.body;
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    if (!nome || !normalizedEmail || !senha) return res.status(400).json({ error: 'nome, email e senha são obrigatórios' });
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return res.status(400).json({ error: 'Informe um e-mail válido' });
    if (String(senha).length < 6) return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres' });
    const result = await run('INSERT INTO usuario (nome,email,senha,nivel_escolar,idade,sexo) VALUES (?,?,?,?,?,?)', [String(nome).trim(), normalizedEmail, hashPassword(String(senha)), nivelEscolar ?? null, idade ?? null, sexo ?? null]);
    const usuario = await get('SELECT id,nome,email,nivel_escolar AS nivelEscolar,idade,sexo,foto FROM usuario WHERE id=?', [result.insertId]);
    res.status(201).json(usuario);
  } catch {
    res.status(400).json({ error: 'Não foi possível criar a conta. O e-mail pode já estar cadastrado.' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, senha } = req.body;
  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  const usuario = await get<any>('SELECT * FROM usuario WHERE email=?', [normalizedEmail]);
  if (!usuario || !verifyPassword(String(senha ?? ''), String(usuario.senha))) return res.status(401).json({ error: 'E-mail ou senha inválidos' });
  if (!String(usuario.senha).includes(':')) await run('UPDATE usuario SET senha=? WHERE id=?', [hashPassword(String(senha)), usuario.id]);
  res.json({ id: usuario.id, nome: usuario.nome, email: usuario.email, nivelEscolar: usuario.nivel_escolar, idade: usuario.idade, sexo: usuario.sexo, foto: usuario.foto });
});

app.get('/disciplinas', async (req, res) => {
  const usuarioId = id(req.query.usuarioId);
  const disciplinas = await all('SELECT * FROM disciplina WHERE usuario_id=? ORDER BY nome', [usuarioId]);
  const conteudos = await all('SELECT * FROM conteudo WHERE disciplina_id IN (SELECT id FROM disciplina WHERE usuario_id=?) ORDER BY nome', [usuarioId]);
  res.json(disciplinas.map((d: any) => ({ ...d, usuario_id: undefined, conteudos: conteudos.filter((c: any) => c.disciplina_id === d.id) })));
});

app.post('/disciplinas', async (req, res) => {
  try {
    const { usuarioId, nome, area, nota = 0 } = req.body;
    const result = await run('INSERT INTO disciplina (usuario_id,nome,area,nota) VALUES (?,?,?,?)', [id(usuarioId), nome, area, Number(nota)]);
    res.status(201).json(await get('SELECT * FROM disciplina WHERE id=?', [result.insertId]));
  } catch { res.status(400).json({ error: 'Não foi possível criar a disciplina' }); }
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
  res.status(201).json(await get('SELECT * FROM conteudo WHERE id=?', [result.insertId]));
});
app.put('/conteudos/:id', async (req, res) => {
  await run('UPDATE conteudo SET nome=?,estudado=? WHERE id=?', [req.body.nome, req.body.estudado ? 1 : 0, id(req.params.id)]);
  res.json(await get('SELECT * FROM conteudo WHERE id=?', [id(req.params.id)]));
});
app.delete('/conteudos/:id', async (req, res) => { await run('DELETE FROM conteudo WHERE id=?', [id(req.params.id)]); res.status(204).end(); });

app.get('/registros', async (req, res) => res.json(await all('SELECT r.*, d.nome AS disciplina_nome, c.nome AS conteudo_nome FROM registro_estudo r JOIN disciplina d ON d.id=r.disciplina_id LEFT JOIN conteudo c ON c.id=r.conteudo_id WHERE r.usuario_id=? ORDER BY r.data DESC', [id(req.query.usuarioId)])));
app.post('/registros', async (req, res) => {
  const { usuarioId, disciplinaId, conteudoId, data, duracao = 0, observacao } = req.body;
  const result = await run('INSERT INTO registro_estudo (usuario_id,disciplina_id,conteudo_id,data,duracao,observacao) VALUES (?,?,?,?,?,?)', [id(usuarioId), id(disciplinaId), conteudoId ? id(conteudoId) : null, data ?? new Date().toISOString(), Number(duracao), observacao ?? null]);
  res.status(201).json(await get('SELECT * FROM registro_estudo WHERE id=?', [result.insertId]));
});

app.get('/cronograma', async (req, res) => res.json(await all('SELECT c.*, d.nome AS disciplina_nome FROM cronograma c JOIN disciplina d ON d.id=c.disciplina_id WHERE c.usuario_id=? ORDER BY c.data,c.inicio', [id(req.query.usuarioId)])));
app.post('/cronograma', async (req, res) => {
  const { usuarioId, disciplinaId, data, inicio, fim, titulo, observacao } = req.body;
  const result = await run('INSERT INTO cronograma (usuario_id,disciplina_id,data,inicio,fim,titulo,observacao) VALUES (?,?,?,?,?,?,?)', [id(usuarioId), id(disciplinaId), data, inicio, fim, titulo, observacao ?? null]);
  res.status(201).json(await get('SELECT * FROM cronograma WHERE id=?', [result.insertId]));
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
  res.status(201).json(await get('SELECT * FROM meta WHERE id=?', [result.insertId]));
});
app.put('/metas/:id', async (req, res) => { await run('UPDATE meta SET texto=?,observacao=?,feita=? WHERE id=?', [req.body.texto, req.body.observacao ?? null, req.body.feita ? 1 : 0, id(req.params.id)]); res.json(await get('SELECT * FROM meta WHERE id=?', [id(req.params.id)])); });
app.delete('/metas/:id', async (req, res) => { await run('DELETE FROM meta WHERE id=?', [id(req.params.id)]); res.status(204).end(); });

app.get('/simulados', async (req, res) => res.json(await all('SELECT s.*, d.nome AS disciplina_nome FROM simulado s LEFT JOIN disciplina d ON d.id=s.disciplina_id WHERE s.usuario_id=? ORDER BY s.data_adicionado DESC', [id(req.query.usuarioId)])));
app.post('/simulados', async (req, res) => { const { usuarioId, disciplinaId, titulo, arquivo } = req.body; const result = await run('INSERT INTO simulado (usuario_id,disciplina_id,titulo,arquivo) VALUES (?,?,?,?)', [id(usuarioId), disciplinaId ? id(disciplinaId) : null, titulo, arquivo]); res.status(201).json(await get('SELECT * FROM simulado WHERE id=?', [result.insertId])); });
app.delete('/simulados/:id', async (req, res) => { await run('DELETE FROM simulado WHERE id=?', [id(req.params.id)]); res.status(204).end(); });

app.patch('/usuarios/:id', async (req, res) => {
  const { nome, email, foto, nivelEscolar, idade, sexo } = req.body;
  await run('UPDATE usuario SET nome=COALESCE(?,nome),email=COALESCE(?,email),foto=COALESCE(?,foto),nivel_escolar=COALESCE(?,nivel_escolar),idade=COALESCE(?,idade),sexo=COALESCE(?,sexo) WHERE id=?', [nome ?? null, email ?? null, foto ?? null, nivelEscolar ?? null, idade ?? null, sexo ?? null, id(req.params.id)]);
  res.json(await get('SELECT id,nome,email,foto,nivel_escolar AS nivelEscolar,idade,sexo FROM usuario WHERE id=?', [id(req.params.id)]));
});

app.listen(port, () => console.log(`StudyTrack API SQL em http://localhost:${port}`));
