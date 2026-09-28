import { getDatabase, initDatabase } from '../database/database';
export type DisciplinaDb={id:string;nome:string;area:string;nota:number};
export type ConteudoDb={id:string;disciplina_id:string;nome:string;estudado:number};
export type RegistroDb={id:string;disciplina_id:string;conteudo_id:string|null;data:string;duracao:number;observacao:string|null;fotos:string|null};
export type CronogramaDb={id:string;disciplina_id:string;data:string;inicio:string;fim:string;titulo:string;observacao:string|null;concluido:number};
export type MetaDb={id:string;texto:string;feita:number;observacao:string|null;foto:string|null};
export type SimuladoDb={id:string;titulo:string;materia:string|null;arquivo:string;data_adicionado:string};
export async function listarDisciplinas(){const db=await initDatabase();return db.getAllAsync<DisciplinaDb>('SELECT * FROM disciplina ORDER BY nome');}
export async function adicionarDisciplina(nome:string,area:string,nota=0){const db=await getDatabase();const id=`disc-${Date.now()}`;await db.runAsync('INSERT INTO disciplina(id,nome,area,nota) VALUES(?,?,?,?)',id,nome.trim(),area,nota);return id;}
export async function editarDisciplina(id:string,nome:string,area:string,nota:number){const db=await getDatabase();await db.runAsync('UPDATE disciplina SET nome=?,area=?,nota=? WHERE id=?',nome.trim(),area,nota,id);}
export async function excluirDisciplina(id:string){const db=await getDatabase();await db.runAsync('DELETE FROM disciplina WHERE id=?',id);}
export async function listarConteudos(id:string){const db=await initDatabase();return db.getAllAsync<ConteudoDb>('SELECT * FROM conteudo WHERE disciplina_id=? ORDER BY nome',id);}
export async function adicionarConteudo(disciplinaId:string,nome:string){const db=await getDatabase();const id=`cont-${Date.now()}`;await db.runAsync('INSERT INTO conteudo(id,disciplina_id,nome,estudado) VALUES(?,?,?,0)',id,disciplinaId,nome.trim());return id;}
export async function editarConteudo(id:string,nome:string){const db=await getDatabase();await db.runAsync('UPDATE conteudo SET nome=? WHERE id=?',nome.trim(),id);}
export async function excluirConteudo(id:string){const db=await getDatabase();await db.runAsync('DELETE FROM conteudo WHERE id=?',id);}
export async function marcarConteudo(id:string,estudado:boolean){const db=await getDatabase();await db.runAsync('UPDATE conteudo SET estudado=? WHERE id=?',estudado?1:0,id);}
export async function listarRegistros(id:string){const db=await initDatabase();return db.getAllAsync<RegistroDb>('SELECT * FROM registro_estudo WHERE disciplina_id=? ORDER BY data DESC',id);}
export async function listarTodosRegistros(){const db=await initDatabase();return db.getAllAsync<RegistroDb>('SELECT * FROM registro_estudo ORDER BY data DESC');}
export async function registrarEstudo(disciplinaId:string,duracao:number,conteudoId?:string,observacao?:string,fotos:string[]=[]){const db=await getDatabase();await db.runAsync('INSERT INTO registro_estudo(id,disciplina_id,conteudo_id,data,duracao,observacao,fotos) VALUES(?,?,?,?,?,?,?)',`est-${Date.now()}`,disciplinaId,conteudoId??null,new Date().toISOString(),duracao,observacao??null,JSON.stringify(fotos));}
export async function excluirRegistro(id:string){const db=await getDatabase();await db.runAsync('DELETE FROM registro_estudo WHERE id=?',id);}
export async function listarCronograma(data?:string){const db=await initDatabase();return data?db.getAllAsync<CronogramaDb>('SELECT * FROM cronograma WHERE data=? ORDER BY inicio',data):db.getAllAsync<CronogramaDb>('SELECT * FROM cronograma ORDER BY data,inicio');}
export async function adicionarBloco(disciplinaId:string,data:string,inicio:string,fim:string,titulo:string,observacao=''){const db=await getDatabase();const id=`bloco-${Date.now()}`;await db.runAsync('INSERT INTO cronograma(id,disciplina_id,data,inicio,fim,titulo,observacao,concluido) VALUES(?,?,?,?,?,?,?,0)',id,disciplinaId,data,inicio,fim,titulo,observacao);return id;}
export async function editarBloco(id:string,disciplinaId:string,data:string,inicio:string,fim:string,titulo:string,observacao=''){const db=await getDatabase();await db.runAsync('UPDATE cronograma SET disciplina_id=?,data=?,inicio=?,fim=?,titulo=?,observacao=? WHERE id=?',disciplinaId,data,inicio,fim,titulo,observacao,id);}
export async function alternarBloco(id:string,done:boolean){const db=await getDatabase();await db.runAsync('UPDATE cronograma SET concluido=? WHERE id=?',done?1:0,id);}
export async function excluirBloco(id:string){const db=await getDatabase();await db.runAsync('DELETE FROM cronograma WHERE id=?',id);}
export async function listarMetas(){const db=await initDatabase();return db.getAllAsync<MetaDb>('SELECT * FROM meta ORDER BY id');}
export async function adicionarMeta(texto:string,observacao='',foto?:string){const db=await getDatabase();const id=`meta-${Date.now()}`;await db.runAsync('INSERT INTO meta(id,texto,feita,observacao,foto) VALUES(?,?,0,?,?)',id,texto.trim(),observacao,foto??null);return id;}
export async function editarMeta(id:string,texto:string,observacao='',foto?:string|null){const db=await getDatabase();await db.runAsync('UPDATE meta SET texto=?,observacao=?,foto=? WHERE id=?',texto.trim(),observacao,foto??null,id);}
export async function alternarMetaDb(id:string,done:boolean){const db=await getDatabase();await db.runAsync('UPDATE meta SET feita=? WHERE id=?',done?1:0,id);}
export async function excluirMeta(id:string){const db=await getDatabase();await db.runAsync('DELETE FROM meta WHERE id=?',id);}
export async function listarSimulados(){const db=await initDatabase();return db.getAllAsync<SimuladoDb>('SELECT * FROM simulado ORDER BY data_adicionado DESC');}
export async function adicionarSimulado(titulo:string,materia:string,arquivo:string){const db=await getDatabase();const id=`sim-${Date.now()}`;await db.runAsync('INSERT INTO simulado(id,titulo,materia,arquivo,data_adicionado) VALUES(?,?,?,?,?)',id,titulo,materia||null,arquivo,new Date().toISOString());return id;}
export async function excluirSimulado(id:string){const db=await getDatabase();await db.runAsync('DELETE FROM simulado WHERE id=?',id);}
