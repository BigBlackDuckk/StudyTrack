import { getDatabase, initDatabase } from '../database/database';
export type DisciplinaDb={id:string;nome:string;area:string;nota:number};
export async function listarDisciplinas(){const db=await initDatabase();return db.getAllAsync<DisciplinaDb>('SELECT * FROM disciplina ORDER BY nome');}
export async function adicionarDisciplina(nome:string,area:string,nota=0){const db=await getDatabase();const id=`disc-${Date.now()}`;await db.runAsync('INSERT INTO disciplina(id,nome,area,nota) VALUES(?,?,?,?)',id,nome.trim(),area,nota);return id;}
export async function editarDisciplina(id:string,nome:string,area:string,nota:number){const db=await getDatabase();await db.runAsync('UPDATE disciplina SET nome=?,area=?,nota=? WHERE id=?',nome.trim(),area,nota,id);}
export async function excluirDisciplina(id:string){const db=await getDatabase();await db.runAsync('DELETE FROM disciplina WHERE id=?',id);}
