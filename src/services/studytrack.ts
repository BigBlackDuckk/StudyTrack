import { getDatabase, initDatabase } from '../database/database';
export type DisciplinaDb={id:string;nome:string;area:string;nota:number};
export type ConteudoDb={id:string;disciplina_id:string;nome:string;estudado:number};
export async function listarDisciplinas(){const db=await initDatabase();return db.getAllAsync<DisciplinaDb>('SELECT * FROM disciplina ORDER BY nome');}
export async function adicionarDisciplina(nome:string,area:string,nota=0){const db=await getDatabase();const id=`disc-${Date.now()}`;await db.runAsync('INSERT INTO disciplina(id,nome,area,nota) VALUES(?,?,?,?)',id,nome.trim(),area,nota);return id;}
export async function editarDisciplina(id:string,nome:string,area:string,nota:number){const db=await getDatabase();await db.runAsync('UPDATE disciplina SET nome=?,area=?,nota=? WHERE id=?',nome.trim(),area,nota,id);}
export async function excluirDisciplina(id:string){const db=await getDatabase();await db.runAsync('DELETE FROM disciplina WHERE id=?',id);}
export async function listarConteudos(id:string){const db=await initDatabase();return db.getAllAsync<ConteudoDb>('SELECT * FROM conteudo WHERE disciplina_id=? ORDER BY nome',id);}
export async function adicionarConteudo(disciplinaId:string,nome:string){const db=await getDatabase();const id=`cont-${Date.now()}`;await db.runAsync('INSERT INTO conteudo(id,disciplina_id,nome,estudado) VALUES(?,?,?,0)',id,disciplinaId,nome.trim());return id;}
export async function editarConteudo(id:string,nome:string){const db=await getDatabase();await db.runAsync('UPDATE conteudo SET nome=? WHERE id=?',nome.trim(),id);}
export async function excluirConteudo(id:string){const db=await getDatabase();await db.runAsync('DELETE FROM conteudo WHERE id=?',id);}
export async function marcarConteudo(id:string,estudado:boolean){const db=await getDatabase();await db.runAsync('UPDATE conteudo SET estudado=? WHERE id=?',estudado?1:0,id);}
