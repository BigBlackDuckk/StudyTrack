// Sincronização one-way (app -> API): o SQLite local continua sendo a fonte de
// verdade e funciona offline. Cada escrita local enfileira um item em
// `sync_outbox`; o flush envia para a API usando o mapeamento local -> id
// remoto guardado em `sync_map`. Falhas de rede apenas adiam o envio.
import { api } from '../api';
import { getDatabase, getSetting, setSetting } from '../database/database';

export type TabelaSync = 'usuario' | 'disciplina' | 'conteudo' | 'registro_estudo' | 'meta' | 'cronograma' | 'simulado';
export type AcaoSync = 'upsert' | 'delete';

const ROTAS: Record<TabelaSync, string> = {
  usuario: 'usuarios',
  disciplina: 'disciplinas',
  conteudo: 'conteudos',
  registro_estudo: 'registros',
  meta: 'metas',
  cronograma: 'cronograma',
  simulado: 'simulados',
};

type ItemOutbox = { id: number; tabela: TabelaSync; acao: AcaoSync; id_local: string; tentativas: number };

/** Guarda um pendente de sincronização e dispara o flush em background. */
export async function enfileirar(tabela: TabelaSync, acao: AcaoSync, idLocal: string) {
  try {
    const db = await getDatabase();
    // Um único pendente por registro: o estado local é lido no momento do
    // flush, então substituir o item anterior deixa o envio sempre atual.
    await db.runAsync('DELETE FROM sync_outbox WHERE tabela=? AND id_local=?', tabela, idLocal);
    await db.runAsync('INSERT INTO sync_outbox(tabela,acao,id_local,tentativas) VALUES(?,?,?,0)', tabela, acao, idLocal);
    void disparaFlush();
  } catch (e) {
    console.warn('sync: não foi possível enfileirar', tabela, idLocal, e);
  }
}

let fila: Promise<void> = Promise.resolve();

/** Serializa os flushes para não enviar a mesma fila duas vezes em paralelo. */
export function disparaFlush(): Promise<void> {
  fila = fila.then(flush).catch((e) => console.warn('sync: flush falhou', e));
  return fila;
}

async function flush() {
  const apiUsuarioId = await getSetting('api_usuario_id');
  if (!apiUsuarioId) return; // sem conta autenticada na API, nada a enviar
  const db = await getDatabase();
  const itens = await db.getAllAsync<ItemOutbox>('SELECT * FROM sync_outbox ORDER BY id');
  for (const item of itens) {
    try {
      await processar(item.tabela, item.acao, item.id_local, Number(apiUsuarioId));
      await db.runAsync('DELETE FROM sync_outbox WHERE id=?', item.id);
    } catch (e) {
      const tentativas = item.tentativas + 1;
      if (tentativas >= 5) {
        await db.runAsync('DELETE FROM sync_outbox WHERE id=?', item.id);
        console.warn(`sync: descartando ${item.tabela}/${item.id_local} após ${tentativas} tentativas`, e);
      } else {
        await db.runAsync('UPDATE sync_outbox SET tentativas=? WHERE id=?', tentativas, item.id);
        break; // preserva a ordem (ex.: criar disciplina antes do conteúdo)
      }
    }
  }
}

async function mapaGet(tabela: TabelaSync, idLocal: string) {
  const db = await getDatabase();
  const r = await db.getFirstAsync<{ id_remoto: number }>('SELECT id_remoto FROM sync_map WHERE tabela=? AND id_local=?', tabela, idLocal);
  return r?.id_remoto ?? null;
}
async function mapaSet(tabela: TabelaSync, idLocal: string, idRemoto: number) {
  const db = await getDatabase();
  await db.runAsync('INSERT INTO sync_map(tabela,id_local,id_remoto) VALUES(?,?,?) ON CONFLICT(tabela,id_local) DO UPDATE SET id_remoto=excluded.id_remoto', tabela, idLocal, idRemoto);
}
async function mapaDel(tabela: TabelaSync, idLocal: string) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sync_map WHERE tabela=? AND id_local=?', tabela, idLocal);
}

async function remoteDisciplina(idLocal: string, apiUsuarioId: number): Promise<number> {
  const jaMapeada = await mapaGet('disciplina', idLocal);
  if (jaMapeada != null) return jaMapeada;
  const row = await lerLocal('disciplina', idLocal);
  if (!row) throw new Error(`disciplina local ${idLocal} não existe mais`);
  let criada: { id: number };
  try {
    criada = await api<{ id: number }>('/disciplinas', { method: 'POST', body: JSON.stringify({ usuarioId: apiUsuarioId, nome: row.nome, area: row.area, nota: row.nota }) });
  } catch (e) {
    // Pode já existir no servidor (ex.: sync anterior que perdeu o mapa); o
    // backend tem UNIQUE(usuario_id, nome), então procura pelo nome.
    const existentes = await api<{ id: number; nome: string }[]>(`/disciplinas?usuarioId=${apiUsuarioId}`);
    const achada = existentes.find((d) => d.nome === row.nome);
    if (!achada) throw e;
    criada = achada;
  }
  await mapaSet('disciplina', idLocal, criada.id);
  return criada.id;
}

async function processar(tabela: TabelaSync, acao: AcaoSync, idLocal: string, apiUsuarioId: number) {
  const remoto = tabela === 'usuario' ? apiUsuarioId : await mapaGet(tabela, idLocal);

  if (acao === 'delete') {
    if (remoto != null) {
      await api(`/${ROTAS[tabela]}/${remoto}`, { method: 'DELETE' });
      await mapaDel(tabela, idLocal);
    }
    return;
  }

  const row = await lerLocal(tabela, idLocal);
  if (!row) {
    // Criado e apagado antes do flush: só limpa o remoto, se existir.
    if (remoto != null) {
      await api(`/${ROTAS[tabela]}/${remoto}`, { method: 'DELETE' });
      await mapaDel(tabela, idLocal);
    }
    return;
  }

  switch (tabela) {
    case 'usuario': {
      await api(`/usuarios/${apiUsuarioId}`, {
        method: 'PATCH',
        body: JSON.stringify({ nome: row.nome, email: row.email, foto: row.avatar, nivelEscolar: row.nivel, idade: row.idade, sexo: row.sexo }),
      });
      return;
    }
    case 'disciplina': {
      if (remoto != null) {
        await api(`/disciplinas/${remoto}`, { method: 'PUT', body: JSON.stringify({ nome: row.nome, area: row.area, nota: row.nota }) });
      } else {
        await remoteDisciplina(idLocal, apiUsuarioId);
      }
      return;
    }
    case 'conteudo': {
      const disciplinaId = await remoteDisciplina(row.disciplina_id, apiUsuarioId);
      if (remoto != null) {
        await api(`/conteudos/${remoto}`, { method: 'PUT', body: JSON.stringify({ nome: row.nome, estudado: row.estudado ? 1 : 0 }) });
      } else {
        const criado = await api<{ id: number }>('/conteudos', { method: 'POST', body: JSON.stringify({ disciplinaId, nome: row.nome }) });
        await mapaSet('conteudo', idLocal, criado.id);
        if (row.estudado) await api(`/conteudos/${criado.id}`, { method: 'PUT', body: JSON.stringify({ nome: row.nome, estudado: 1 }) });
      }
      return;
    }
    case 'registro_estudo': {
      if (remoto != null) return; // registros não são editados no app
      const disciplinaId = await remoteDisciplina(row.disciplina_id, apiUsuarioId);
      const conteudoId = row.conteudo_id ? await remoteConteudo(row.conteudo_id, apiUsuarioId) : null;
      const criado = await api<{ id: number }>('/registros', {
        method: 'POST',
        body: JSON.stringify({ usuarioId: apiUsuarioId, disciplinaId, conteudoId, data: row.data, duracao: row.duracao, observacao: row.observacao }),
      });
      await mapaSet('registro_estudo', idLocal, criado.id);
      return;
    }
    case 'meta': {
      const body = { texto: row.texto, observacao: row.observacao, feita: row.feita ? 1 : 0 };
      if (remoto != null) {
        await api(`/metas/${remoto}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        const criada = await api<{ id: number }>('/metas', { method: 'POST', body: JSON.stringify({ usuarioId: apiUsuarioId, texto: row.texto, observacao: row.observacao }) });
        await mapaSet('meta', idLocal, criada.id);
        if (row.feita) await api(`/metas/${criada.id}`, { method: 'PUT', body: JSON.stringify(body) });
      }
      return;
    }
    case 'cronograma': {
      const disciplinaId = await remoteDisciplina(row.disciplina_id, apiUsuarioId);
      const body = { disciplinaId, data: row.data, inicio: row.inicio, fim: row.fim, titulo: row.titulo, observacao: row.observacao, concluido: row.concluido ? 1 : 0 };
      if (remoto != null) {
        await api(`/cronograma/${remoto}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        const criado = await api<{ id: number }>('/cronograma', {
          method: 'POST',
          body: JSON.stringify({ usuarioId: apiUsuarioId, disciplinaId, data: row.data, inicio: row.inicio, fim: row.fim, titulo: row.titulo, observacao: row.observacao }),
        });
        await mapaSet('cronograma', idLocal, criado.id);
        if (row.concluido) await api(`/cronograma/${criado.id}`, { method: 'PUT', body: JSON.stringify(body) });
      }
      return;
    }
    case 'simulado': {
      if (remoto != null) return; // simulados não são editados no app
      const criado = await api<{ id: number }>('/simulados', {
        method: 'POST',
        body: JSON.stringify({ usuarioId: apiUsuarioId, disciplinaId: null, titulo: row.titulo, arquivo: row.arquivo }),
      });
      await mapaSet('simulado', idLocal, criado.id);
      return;
    }
  }
}

async function remoteConteudo(idLocal: string, apiUsuarioId: number): Promise<number> {
  const jaMapeado = await mapaGet('conteudo', idLocal);
  if (jaMapeado != null) return jaMapeado;
  const row = await lerLocal('conteudo', idLocal);
  if (!row) throw new Error(`conteudo local ${idLocal} não existe mais`);
  const disciplinaId = await remoteDisciplina(row.disciplina_id, apiUsuarioId);
  const criado = await api<{ id: number }>('/conteudos', { method: 'POST', body: JSON.stringify({ disciplinaId, nome: row.nome }) });
  await mapaSet('conteudo', idLocal, criado.id);
  if (row.estudado) await api(`/conteudos/${criado.id}`, { method: 'PUT', body: JSON.stringify({ nome: row.nome, estudado: 1 }) });
  return criado.id;
}


type LinhaLocal = Record<string, any>;

async function lerLocal(tabela: TabelaSync, idLocal: string): Promise<LinhaLocal | null> {
  const db = await getDatabase();
  return db.getFirstAsync<LinhaLocal>(`SELECT * FROM ${tabela} WHERE id=?`, idLocal);
}


/**
 * Autentica (ou cria) a conta na API usando a senha digitada no login — a API
 * guarda o hash dela, o app nunca mais vai vê-la. Salva o id remoto e já
 * tenta esvaziar a fila de pendências. Nunca derruba o login local.
 */
export async function syncConta(opts: { create: boolean; nome: string; email: string; senha: string; nivel?: string; idade?: string; sexo?: string }) {
  const payload = { nome: opts.nome, email: opts.email, senha: opts.senha, nivelEscolar: opts.nivel || null, idade: opts.idade || null, sexo: opts.sexo || null };
  try {
    let remoto: { id: number };
    if (opts.create) {
      try {
        remoto = await api('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
      } catch {
        // Conta já existe na API (cadastro local anterior): entra com a mesma senha.
        remoto = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: opts.email, senha: opts.senha }) });
      }
    } else {
      try {
        remoto = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: opts.email, senha: opts.senha }) });
      } catch {
        // Ainda não foi criada na API: cria agora com os dados locais.
        remoto = await api('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
      }
    }
    await setSetting('api_usuario_id', String(remoto.id));
    void disparaFlush();
  } catch (e) {
    // API fora do ar ou senha divergente: o app segue offline; o próximo
    // login tenta de novo.
    console.warn('sync: não foi possível autenticar na API', e);
  }
}
