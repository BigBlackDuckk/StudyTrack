import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Btn, Card, Check, Chip, Field, Icon, ModalBox } from '../componets/ui';
import { Theme, areaColor } from '../global/theme';
import { AREAS, Disciplina, fmtDate, fmtDur } from '../global/utils';
import {
  adicionarConteudo, adicionarDisciplina, editarConteudo, editarDisciplina, excluirConteudo, excluirDisciplina, excluirRegistro,
  listarConteudos, listarRegistros, marcarConteudo, registrarEstudo,
} from '../services/studytrack';
import type { ConteudoDb, MetaDb, RegistroDb } from '../services/studytrack';

type Stats = Record<string, { total: number; done: number }>;

export async function carregarStats(discs: Disciplina[]): Promise<Stats> {
  const x: Stats = {};
  for (const d of discs) {
    const c = await listarConteudos(d.id);
    x[d.id] = { total: c.length, done: c.filter((v) => !!v.estudado).length };
  }
  return x;
}
export const pctDisc = (d: Disciplina, st?: { total: number; done: number }) => (st?.total ? Math.round((st.done / st.total) * 100) : Math.round(d.nota));

const confirmar = (titulo: string, msg: string | undefined, fn: () => void) =>
  Alert.alert(titulo, msg, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: fn }]);

function Barra({ pct, color = '#7C37BE', bg = '#EDE7F6' }: { pct: number; color?: string; bg?: string }) {
  return (
    <View style={{ height: 7, borderRadius: 4, backgroundColor: bg, overflow: 'hidden', marginTop: 10 }}>
      <View style={{ width: `${Math.min(100, pct)}%`, height: 7, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

function Hero({ t, big, label, extra }: { t: Theme; big: string; label: string; extra?: React.ReactNode }) {
  return (
    <View style={[m.hero, { backgroundColor: t.card }]}>
      <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '800' }}>{big}</Text>
      <Text style={{ color: '#EFE2FB', marginTop: 2 }}>{label}</Text>
      {extra}
    </View>
  );
}

/* ---------- Todas as matérias ---------- */
export function SubjectsModal({ t, visible, discs, onClose, onOpen, reload }: { t: Theme; visible: boolean; discs: Disciplina[]; onClose: () => void; onOpen: (d: Disciplina) => void; reload: () => void }) {
  const [edit, setEdit] = useState<Disciplina | null>(null);
  const [add, setAdd] = useState(false);
  return (
    <ModalBox visible={visible} onClose={onClose} t={t} title="Todas as matérias">
      <ScrollView style={{ maxHeight: 560 }}>
        {discs.map((d) => (
          <Card key={d.id} t={t} style={[m.flat, { borderLeftWidth: 4, borderLeftColor: areaColor(d.area), backgroundColor: t.input }]} onPress={() => { onClose(); onOpen(d); }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontWeight: '800', fontSize: 16 }}>{d.nome}</Text>
                <Text style={{ color: t.muted, marginTop: 2 }}>{d.area} · desempenho {d.nota}%</Text>
              </View>
              <TouchableOpacity onPress={() => setEdit(d)} hitSlop={8} style={{ marginRight: 14 }}>
                <Icon name="edit-2" size={18} color={t.accent} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmar('Excluir matéria?', `Excluir ${d.nome} e seus dados relacionados?`, async () => { await excluirDisciplina(d.id); reload(); })} hitSlop={8}>
                <Icon name="trash-2" size={18} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScrollView>
      <Btn t={t} label="Inserir matéria" icon="plus" onPress={() => setAdd(true)} />
      <SubjectForm t={t} visible={add} onClose={() => setAdd(false)} reload={reload} />
      <SubjectForm t={t} visible={!!edit} initial={edit || undefined} onClose={() => setEdit(null)} reload={reload} />
    </ModalBox>
  );
}

function SubjectForm({ t, visible, onClose, reload, initial }: { t: Theme; visible: boolean; onClose: () => void; reload: () => void; initial?: Disciplina }) {
  const [nome, setNome] = useState('');
  const [area, setArea] = useState('Exatas');
  const [nota, setNota] = useState('0');
  useEffect(() => {
    setNome(initial?.nome || '');
    setArea(initial?.area || 'Exatas');
    setNota(String(initial?.nota ?? 0));
  }, [initial, visible]);
  const save = async () => {
    if (!nome.trim()) return Alert.alert('Digite o nome da matéria');
    if (initial) await editarDisciplina(initial.id, nome, area, Number(nota) || 0);
    else await adicionarDisciplina(nome, area, Number(nota) || 0);
    onClose();
    reload();
  };
  return (
    <ModalBox visible={visible} onClose={onClose} t={t} title={initial ? 'Editar matéria' : 'Nova matéria'}>
      <Field t={t} value={nome} onChangeText={setNome} placeholder="Nome da matéria" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
        {AREAS.map((a) => <Chip key={a} t={t} label={a} on={area === a} onPress={() => setArea(a)} />)}
      </View>
      <Field t={t} value={nota} onChangeText={setNota} keyboardType="numeric" placeholder="Desempenho inicial (%)" />
      <Btn t={t} label="Salvar matéria" onPress={save} />
    </ModalBox>
  );
}

/* ---------- Detalhe da matéria ---------- */
export function SubjectModal({ t, disc, onClose, reload }: { t: Theme; disc: Disciplina | null; onClose: () => void; reload: () => void }) {
  const [contents, setContents] = useState<ConteudoDb[]>([]);
  const [records, setRecords] = useState<RegistroDb[]>([]);
  const [newC, setNewC] = useState('');
  const [obs, setObs] = useState('');
  const [photo, setPhoto] = useState<string[]>([]);
  const [duration, setDuration] = useState('30');
  const [editing, setEditing] = useState<ConteudoDb | null>(null);

  const refresh = async () => {
    if (!disc) return;
    setContents(await listarConteudos(disc.id));
    setRecords(await listarRegistros(disc.id));
  };
  useEffect(() => { refresh(); }, [disc]);
  if (!disc) return null;

  const done = contents.filter((x) => !!x.estudado).length;
  const pct = contents.length ? Math.round((done / contents.length) * 100) : 0;
  const pickPhotos = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: 'image/*', multiple: true, copyToCacheDirectory: true });
    if (!r.canceled) setPhoto((p) => [...p, ...r.assets.map((a) => a.uri)]);
  };

  return (
    <ModalBox visible={!!disc} onClose={onClose} t={t} title={disc.nome}>
      <ScrollView style={{ maxHeight: 640 }} showsVerticalScrollIndicator={false}>
        <Hero t={t} big={`${pct}%`} label="dos conteúdos marcados como estudados" extra={<Barra pct={pct} color="#EBD741" bg="rgba(255,255,255,0.3)" />} />

        <Text style={[m.h, { color: t.text }]}>Conteúdos</Text>
        {contents.map((c) => (
          <View key={c.id} style={[m.row, { borderBottomColor: t.line }]}>
            <Check t={t} on={!!c.estudado} onPress={async () => { await marcarConteudo(c.id, !c.estudado); await refresh(); reload(); }} />
            <Text style={{ color: t.text, fontWeight: '600', flex: 1, marginLeft: 12, textDecorationLine: c.estudado ? 'line-through' : 'none' }}>{c.nome}</Text>
            <TouchableOpacity onPress={() => setEditing(c)} hitSlop={8} style={{ marginRight: 14 }}>
              <Icon name="edit-2" size={17} color={t.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmar('Excluir conteúdo?', undefined, async () => { await excluirConteudo(c.id); await refresh(); reload(); })} hitSlop={8}>
              <Icon name="trash-2" size={17} color="#DC2626" />
            </TouchableOpacity>
          </View>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Field t={t} value={newC} onChangeText={setNewC} placeholder="Inserir conteúdo que estudou" style={{ flex: 1 }} />
          <Btn t={t} label="" icon="plus" small style={{ marginTop: 10 }} onPress={async () => { if (newC.trim()) { await adicionarConteudo(disc.id, newC); setNewC(''); await refresh(); reload(); } }} />
        </View>
        {editing && <ContentEdit t={t} c={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await refresh(); reload(); }} />}

        <Text style={[m.h, { color: t.text, marginTop: 22 }]}>Registrar estudo</Text>
        <Field t={t} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder="Duração em minutos" />
        <Field t={t} value={obs} onChangeText={setObs} multiline placeholder="O que fiz, dificuldades, evolução..." />
        <Btn t={t} label={`Fotos (${photo.length})`} icon="image" kind="secondary" onPress={pickPhotos} />
        {photo.length > 0 && <ScrollView horizontal>{photo.map((p) => <Image key={p} source={{ uri: p }} style={m.thumb} />)}</ScrollView>}
        <Btn t={t} label="Salvar registro" onPress={async () => { await registrarEstudo(disc.id, (Number(duration) || 0) * 60, undefined, obs, photo); setObs(''); setPhoto([]); await refresh(); reload(); }} />

        <Text style={[m.h, { color: t.text, marginTop: 22 }]}>Anotações e fotos</Text>
        {records.length === 0 ? (
          <Text style={{ color: t.muted, paddingVertical: 12 }}>Nenhum registro ainda. Use o formulário acima.</Text>
        ) : (
          records.map((r) => {
            const fotos = lerFotos(r.fotos);
            return (
              <View key={r.id} style={[m.record, { borderColor: t.line }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontWeight: '800' }}>{fmtDate(r.data)} · {fmtDur(r.duracao)}</Text>
                  {!!r.observacao && <Text style={{ color: t.muted, marginTop: 4 }}>{r.observacao}</Text>}
                  {fotos.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                      {fotos.map((p, i) => <Image key={`${r.id}-${i}`} source={{ uri: p }} style={m.recordPhoto} />)}
                    </ScrollView>
                  )}
                </View>
                <TouchableOpacity onPress={() => confirmar('Excluir registro?', undefined, async () => { await excluirRegistro(r.id); await refresh(); reload(); })} hitSlop={8}>
                  <Icon name="trash-2" size={17} color="#DC2626" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </ModalBox>
  );
}

// Fotos guardadas como JSON. Um registro antigo ou corrompido não pode
// derrubar a tela inteira, então uma falha aqui vira lista vazia.
const lerFotos = (valor: string | null): string[] => {
  if (!valor) return [];
  try {
    const lido = JSON.parse(valor);
    return Array.isArray(lido) ? lido.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

function ContentEdit({ t, c, onClose, onSaved }: { t: Theme; c: ConteudoDb; onClose: () => void; onSaved: () => void }) {
  const [n, setN] = useState(c.nome);
  return (
    <ModalBox visible onClose={onClose} t={t} title="Editar conteúdo">
      <Field t={t} value={n} onChangeText={setN} />
      <Btn t={t} label="Salvar" onPress={async () => { await editarConteudo(c.id, n); onSaved(); }} />
    </ModalBox>
  );
}

/* ---------- Resumo do progresso ---------- */
export function ProgressModal({ t, visible, discs, records, metas, onClose, onOpenSubject }: { t: Theme; visible: boolean; discs: Disciplina[]; records: RegistroDb[]; metas: MetaDb[]; onClose: () => void; onOpenSubject: (d: Disciplina) => void }) {
  const [stats, setStats] = useState<Stats>({});
  useEffect(() => { if (visible) carregarStats(discs).then(setStats); }, [visible, discs]);
  const ps = discs.map((d) => pctDisc(d, stats[d.id]));
  const geral = ps.length ? Math.round(ps.reduce((a, b) => a + b, 0) / ps.length) : 0;
  const total = records.reduce((a, r) => a + r.duracao, 0);
  return (
    <ModalBox visible={visible} onClose={onClose} t={t} title="Resumo do meu estudo">
      <ScrollView style={{ maxHeight: 600 }} showsVerticalScrollIndicator={false}>
        <Hero t={t} big={`${geral}%`} label="progresso geral das matérias" extra={<Text style={{ color: '#FFFFFF', marginTop: 10 }}>Tempo registrado: {fmtDur(total)} · Metas: {metas.filter((x) => !!x.feita).length}/{metas.length}</Text>} />
        <Text style={[m.h, { color: t.text }]}>Toque em uma matéria</Text>
        {discs.map((d, i) => (
          <Card key={d.id} t={t} style={[m.flat, { borderLeftWidth: 4, borderLeftColor: areaColor(d.area), backgroundColor: t.input }]} onPress={() => { onClose(); onOpenSubject(d); }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontWeight: '800', fontSize: 16 }}>{d.nome}</Text>
                <Text style={{ color: t.muted }}>{stats[d.id]?.done || 0}/{stats[d.id]?.total || 0} conteúdos estudados</Text>
              </View>
              <Text style={{ color: t.primary, fontWeight: '800', fontSize: 20 }}>{ps[i]}%</Text>
            </View>
            <Barra pct={ps[i]} color={t.primary} bg={t.line} />
          </Card>
        ))}
      </ScrollView>
    </ModalBox>
  );
}

const m = StyleSheet.create({
  hero: { borderRadius: 18, padding: 18, marginBottom: 14 },
  h: { fontSize: 17, fontWeight: '800', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  record: { borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 8, flexDirection: 'row' },
  thumb: { width: 72, height: 72, borderRadius: 12, marginRight: 8, marginTop: 10 },
  recordPhoto: { width: 84, height: 84, borderRadius: 12, marginRight: 8 },
  flat: { marginHorizontal: 0, shadowOpacity: 0, elevation: 0 },
});
