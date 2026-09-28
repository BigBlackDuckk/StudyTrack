import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const port = Number(process.env.PORT) || 3333;
const dbFile = process.env.DATABASE_FILE || path.resolve(process.cwd(), 'database', 'studytrack.db');
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

const db = new DatabaseSync(dbFile);
db.exec('PRAGMA foreign_keys = ON;');
const schemaPath = path.resolve(process.cwd(), 'database', 'schema.sql');
db.exec(fs.readFileSync(schemaPath, 'utf8'));
for (const sql of ['ALTER TABLE usuario ADD COLUMN idade TEXT','ALTER TABLE usuario ADD COLUMN sexo TEXT']) { try { db.exec(sql); } catch {} }

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

app.listen(port, () => console.log(`StudyTrack API SQL em http://localhost:${port}`));
