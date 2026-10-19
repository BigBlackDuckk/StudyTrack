import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Btn, Card, Check, Field, Header, Icon, SectionTitle } from '../componets/ui';
import { Theme, TOP, shadow } from '../global/theme';
import { Disciplina, clock, fmtDate, fmtDur, isoDate } from '../global/utils';
import { alternarMetaDb, excluirRegistro, listarRegistros, registrarEstudo } from '../services/studytrack';
import type { MetaDb, RegistroDb } from '../services/studytrack';
import type { useTimer } from '../global/useTimer';

// Anel de progresso feito só com Views (sem react-native-svg).
function Anel({ size, thick, progress, color, track, children }: { size: number; thick: number; progress: number; color: string; track: string; children?: React.ReactNode }) {
  const p = Math.max(0, Math.min(1, progress));
  const half = size / 2;
  const rightRot = p <= 0.5 ? p * 360 - 135 : 45;
  const leftRot = p > 0.5 ? p * 360 - 315 : -135;
  const ring = { position: 'absolute' as const, width: size, height: size, borderRadius: half, borderWidth: thick, borderColor: 'transparent' };
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ ...ring, borderColor: track }} />
      <View style={{ position: 'absolute', width: half, height: size, left: half, overflow: 'hidden' }}>
        <View style={{ ...ring, left: -half, borderTopColor: color, borderRightColor: color, transform: [{ rotate: `${rightRot}deg` }] }} />
      </View>
      <View style={{ position: 'absolute', width: half, height: size, left: 0, overflow: 'hidden' }}>
        <View style={{ ...ring, left: 0, borderBottomColor: color, borderLeftColor: color, transform: [{ rotate: `${leftRot}deg` }] }} />
      </View>
      {children}
    </View>
  );
}

type Props = { t: Theme; discs: Disciplina[]; metas: MetaDb[]; records: RegistroDb[]; timer: ReturnType<typeof useTimer>; reload: () => void };

export default function Registro({ t, discs, metas, records, timer, reload }: Props) {
  const { sec, run, setRun, reset, disc, setDisc } = timer;
  const [lista, setLista] = useState<RegistroDb[]>([]);
  const [obs, setObs] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const atual = discs.find((d) => d.id === disc) || discs[0];
  useEffect(() => { if (!disc && discs[0]) setDisc(discs[0].id); }, [discs, disc]);
  useEffect(() => { if (atual) listarRegistros(atual.id).then(setLista); }, [atual?.id, records]);

  const encerrar = async () => {
    if (!atual) return;
    if (sec < 1) return Alert.alert('Nada para salvar', 'Inicie o cronômetro antes de encerrar.');
    await registrarEstudo(atual.id, sec, undefined, obs, photos);
    reset();
    setObs('');
    setPhotos([]);
    reload();
  };
  const pick = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: 'image/*', multiple: true, copyToCacheDirectory: true });
    if (!r.canceled) setPhotos(r.assets.map((x) => x.uri));
  };

  const hoje = isoDate(new Date());
  const hojeSec = records.filter((r) => r.data.slice(0, 10) === hoje).reduce((a, r) => a + r.duracao, 0) + sec;
  const feitas = metas.filter((x) => !!x.feita).length;
  const listaMetas = [...metas].sort((a, b) => Number(!!a.feita) - Number(!!b.feita)).slice(0, 5);

  return (
    <ScrollView contentContainerStyle={{ paddingTop: TOP, paddingBottom: 28 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Header t={t} title="Foco Ativo" sub={atual ? atual.nome : 'Cadastre uma matéria para começar'} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }} style={{ marginTop: -6, marginBottom: 22 }}>
        {discs.map((d) => {
          const on = d.id === atual?.id;
          return (
            <TouchableOpacity key={d.id} onPress={() => setDisc(d.id)} style={[s.chip, { backgroundColor: on ? t.accent : 'rgba(255,255,255,0.35)' }]}>
              <Text style={{ color: on ? '#FFFFFF' : t.sub, fontSize: 12, fontWeight: '600' }}>{d.nome}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={{ alignItems: 'center', marginBottom: 26 }}>
        <View style={{ borderRadius: 100, ...shadow, shadowOpacity: 0.15 }}>
          <View style={{ borderRadius: 100, backgroundColor: '#FFFFFF' }}>
            <Anel size={200} thick={8} progress={(sec % 3600) / 3600} color={t.primary} track="#E7DFF3">
              <Text style={{ fontSize: 34, fontWeight: '800', color: '#1B1035', letterSpacing: -0.5 }}>{clock(sec)}</Text>
              <Text style={{ fontSize: 10, color: '#3B3352', marginTop: 4, fontWeight: '500' }}>TEMPO DECORRIDO</Text>
            </Anel>
          </View>
        </View>
      </View>

      <View style={s.actions}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => setRun(!run)} style={[s.action, { backgroundColor: '#FFFFFF' }]}>
          <Icon name={run ? 'pause' : 'play'} size={16} color="#1B1035" />
          <Text style={{ color: '#1B1035', fontWeight: '700', marginLeft: 8 }}>{run ? 'Pausar' : sec > 0 ? 'Continuar' : 'Iniciar'}</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.85} onPress={encerrar} style={[s.action, { backgroundColor: t.primary, ...shadow }]}>
          <Icon name="square" size={15} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontWeight: '700', marginLeft: 8 }}>Encerrar</Text>
        </TouchableOpacity>
      </View>

      {(sec > 0 || obs.length > 0 || photos.length > 0) && (
        <Card t={t} style={{ marginTop: 16 }}>
          <Text style={{ color: t.text, fontWeight: '800' }}>Anotações da sessão</Text>
          <Field t={t} value={obs} onChangeText={setObs} multiline placeholder="O que você estudou, dificuldades..." />
          <Btn t={t} label={`Adicionar fotos (${photos.length})`} icon="image" kind="secondary" small onPress={pick} />
          {photos.length > 0 && <ScrollView horizontal>{photos.map((p) => <Image key={p} source={{ uri: p }} style={s.thumb} />)}</ScrollView>}
          <TouchableOpacity onPress={reset} style={{ alignSelf: 'flex-start', marginTop: 12 }}>
            <Text style={{ color: t.muted, fontSize: 12, textDecorationLine: 'underline' }}>Descartar sessão</Text>
          </TouchableOpacity>
        </Card>
      )}

      <View style={{ marginTop: 26 }}>
        <SectionTitle t={t}>Metas do Dia</SectionTitle>
        {listaMetas.length === 0 && <Card t={t}><Text style={{ color: t.muted }}>Nenhuma meta ainda. Crie uma na aba Metas.</Text></Card>}
        {listaMetas.map((mt) => (
          <View key={mt.id} style={[s.meta, { backgroundColor: mt.feita ? 'rgba(255,255,255,0.55)' : '#FFFFFF' }]}>
            <Check t={t} on={!!mt.feita} onPress={async () => { await alternarMetaDb(mt.id, !mt.feita); reload(); }} />
            <Text style={{ flex: 1, marginLeft: 14, color: mt.feita ? t.muted : t.text, fontSize: 14, textDecorationLine: mt.feita ? 'line-through' : 'none' }}>{mt.texto}</Text>
          </View>
        ))}
      </View>

      <View style={s.resumo}>
        <View>
          <Text style={s.resLabel}>HOJE ESTUDADOS</Text>
          <Text style={s.resValue}>{fmtDur(hojeSec)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.resLabel}>METAS ATINGIDAS</Text>
          <Text style={s.resValue}>{feitas}/{metas.length} concluídas</Text>
        </View>
      </View>

      {atual && (
        <View style={{ marginTop: 26 }}>
          <SectionTitle t={t}>{`Registros de ${atual.nome}`}</SectionTitle>
          {lista.length === 0 && <Card t={t}><Text style={{ color: t.muted }}>Nenhuma sessão registrada ainda.</Text></Card>}
          {lista.map((r) => (
            <Card key={r.id} t={t}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontWeight: '800' }}>{fmtDate(r.data)} · {fmtDur(r.duracao)}</Text>
                  {!!r.observacao && <Text style={{ color: t.muted, marginTop: 4 }}>{r.observacao}</Text>}
                </View>
                <TouchableOpacity hitSlop={8} onPress={() => Alert.alert('Excluir registro?', undefined, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: async () => { await excluirRegistro(r.id); reload(); } }])}>
                  <Icon name="trash-2" size={17} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 16, marginRight: 8 },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 24 },
  action: { flex: 1, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  meta: { marginHorizontal: 24, marginBottom: 10, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  resumo: { marginHorizontal: 24, marginTop: 12, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 1, borderColor: 'rgba(124,55,190,0.25)' },
  resLabel: { fontSize: 10, color: '#6E6488', fontWeight: '600' },
  resValue: { fontSize: 15, fontWeight: '800', color: '#1B1035', marginTop: 5 },
  thumb: { width: 72, height: 72, borderRadius: 12, marginRight: 8, marginTop: 10 },
});
