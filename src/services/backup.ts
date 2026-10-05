// Backup manual dos dados do StudyTrack.
//
// Os dados ficam só no aparelho, então o usuário pode gerar um arquivo .json
// para guardar no Drive, no WhatsApp ou no cartão de memória, e restaurar
// depois. Isso não depende de servidor e não custa nada.
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { getDatabase, initDatabase } from '../database/database';

// Ordem importa: as tabelas com chave estrangeira vêm depois das referenciadas.
const TABELAS = [
  'usuario',
  'disciplina',
  'conteudo',
  'registro_estudo',
  'cronograma',
  'meta',
  'simulado',
  'configuracao',
] as const;

const FORMATO = 'studytrack-backup';
const VERSAO = 1;

export type ResumoBackup = {
  disciplina: number;
  registro: number;
  cronograma: number;
  meta: number;
  simulado: number;
};

/** Junta todas as tabelas em um único objeto serializável. */
async function coletar() {
  const db = await initDatabase();
  const dados: Record<string, unknown[]> = {};
  for (const tabela of TABELAS) {
    dados[tabela] = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${tabela}`);
  }
  return dados;
}

const resumoDe = (d: Record<string, unknown[]>): ResumoBackup => ({
  disciplina: (d.disciplina || []).length,
  registro: (d.registro_estudo || []).length,
  cronograma: (d.cronograma || []).length,
  meta: (d.meta || []).length,
  simulado: (d.simulado || []).length,
});

const describe = (r: ResumoBackup) =>
  `${r.disciplina} matérias, ${r.registro} registros, ${r.cronograma} blocos, ${r.meta} metas e ${r.simulado} simulados`;

/** Gera o arquivo e abre a folha de compartilhamento do sistema. */
export async function exportarDados(): Promise<ResumoBackup | null> {
  if (Platform.OS === 'web') {
    throw new Error('A exportação de arquivo funciona no celular. No navegador, use o botão de download do próprio navegador.');
  }
  const dados = await coletar();
  const resumo = resumoDe(dados);
  const conteudo = JSON.stringify({ formato: FORMATO, versao: VERSAO, gerado_em: new Date().toISOString(), dados }, null, 2);

  // No SDK 57 o expo-file-system usa a API por classe: File/Paths. Os métodos
  // antigos (writeAsStringAsync) continuam passando no typecheck, mas lançam
  // erro assim que rodam no aparelho.
  const arquivo = new File(Paths.cache, `studytrack-${new Date().toISOString().slice(0, 10)}.json`);
  arquivo.create({ intermediates: true, overwrite: true });
  arquivo.write(conteudo);

  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(arquivo.uri, { mimeType: 'application/json', dialogTitle: 'Salvar backup do StudyTrack' });
  return resumo;
}

/** Substitui os dados atuais pelos do arquivo escolhido. */
export async function importarDados(): Promise<ResumoBackup | null> {
  const escolhido = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
  if (escolhido.canceled || !escolhido.assets?.[0]) return null;

  let lido: any;
  try {
    lido = JSON.parse(await new File(escolhido.assets[0].uri).text());
  } catch {
    throw new Error('Esse arquivo não é um backup válido do StudyTrack.');
  }

  if (!lido || lido.formato !== FORMATO || !lido.dados) {
    throw new Error('Esse arquivo não é um backup do StudyTrack.');
  }

  const db = await initDatabase();
  // Numa transação: ou entra tudo, ou nada. Sem isso, um arquivo pela metade
  // deixaria o banco inconsistente.
  await db.withExclusiveTransactionAsync(async () => {
    // configuracao e usuario guardam a sessão; restaurar tudo preserva o login.
    for (const tabela of ['registro_estudo', 'conteudo', 'cronograma', 'meta', 'simulado', 'disciplina']) {
      await db.runAsync(`DELETE FROM ${tabela}`);
    }
    for (const tabela of TABELAS) {
      const linhas = (lido.dados[tabela] || []) as Record<string, unknown>[];
      for (const linha of linhas) {
        const cols = Object.keys(linha);
        if (!cols.length) continue;
        const sql = `INSERT OR REPLACE INTO ${tabela} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`;
        await db.runAsync(sql, ...cols.map((c) => linha[c] as any));
      }
    }
  });

  return resumoDe(lido.dados);
}

export async function limparTudo() {
  const db = await getDatabase();
  for (const tabela of ['registro_estudo', 'conteudo', 'cronograma', 'meta', 'simulado', 'disciplina']) {
    await db.runAsync(`DELETE FROM ${tabela}`);
  }
}

export { describe as descreverBackup };