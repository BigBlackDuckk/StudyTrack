import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Btn, Card, Check, Chip, Field, Header, Icon, ModalBox, TopPill } from '../componets/ui';
import DateTimeField from '../componets/DataTimeField';
import { Theme, TOP, areaColor, shadow } from '../global/theme';
import { DIAS, Disciplina, durBloco, isoDate, semanaDe } from '../global/utils';
import { adicionarBloco, alternarBloco, editarBloco, excluirBloco } from '../services/studytrack';
import type { CronogramaDb } from '../services/studytrack';

export default function Cronograma({ t, discs, blocks, reload }: { t: Theme; discs: Disciplina[]; blocks: CronogramaDb[]; reload: () => void }) {
  const [date, setDate] = useState(new Date());
  const [form, setForm] = useState(false);
  const [edit, setEdit] = useState<CronogramaDb | null>(null);

  const selected = isoDate(date);
  const semana = semanaDe(date);
  const dayBlocks = blocks.filter((b) => b.data === selected).sort((a, b) => a.inicio.localeCompare(b.inicio));
  const mover = (dias: number) => { const d = new Date(date); d.setDate(d.getDate() + dias); setDate(d); };

  return (
    <ScrollView contentContainerStyle={{ paddingTop: TOP, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
      <Header t={t} title="Cronograma" right={<TopPill t={t} label="Adicionar" icon="plus" onPress={() => setForm(true)} />} />

      <View style={s.monthRow}>
        <TouchableOpacity onPress={() => mover(-7)} hitSlop={10}><Icon name="chevron-left" size={22} color="#FFFFFF" /></TouchableOpacity>
        <TouchableOpacity onPress={() => setDate(new Date())}>
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14, textTransform: 'capitalize' }}>{date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => mover(7)} hitSlop={10}><Icon name="chevron-right" size={22} color="#FFFFFF" /></TouchableOpacity>
      </View>

      <View style={s.week}>
        {semana.map((d) => {
          const key = isoDate(d);
          const on = key === selected;
          const has = blocks.some((b) => b.data === key);
          return (
            <TouchableOpacity key={key} activeOpacity={0.85} onPress={() => setDate(d)} style={[s.day, on ? { backgroundColor: t.accent, ...shadow } : { backgroundColor: '#FFFFFF' }]}>
              <Text style={{ fontSize: 10, color: on ? '#FFFFFF' : t.muted, fontWeight: '600' }}>{DIAS[d.getDay()]}</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: on ? '#FFFFFF' : t.text, marginTop: 4 }}>{d.getDate()}</Text>
              <View style={{ width: 4, height: 4, borderRadius: 2, marginTop: 4, backgroundColor: has ? (on ? '#FFFFFF' : t.accent) : 'transparent' }} />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ marginTop: 30 }}>
        {dayBlocks.length === 0 ? (
          <Card t={t}><Text style={{ color: t.muted }}>Nenhum estudo agendado para este dia.</Text></Card>
        ) : (
          dayBlocks.map((b) => {
            const d = discs.find((x) => x.id === b.disciplina_id);
            const cor = areaColor(d?.area);
            const dur = durBloco(b.inicio, b.fim);
            return (
              <View key={b.id} style={s.item}>
                <View style={{ width: 52 }}>
                  <Text style={{ color: t.sub, fontWeight: '700', fontSize: 13 }}>{b.inicio}</Text>
                  <Text style={{ color: t.muted, fontSize: 11, marginTop: 2 }}>{b.fim}</Text>
                </View>
                <View style={[s.block, { backgroundColor: t.surface, borderLeftColor: cor }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: t.text, fontSize: 17, fontWeight: '800', flex: 1, textDecorationLine: b.concluido ? 'line-through' : 'none' }} numberOfLines={1}>{b.titulo}</Text>
                    <Check t={t} on={!!b.concluido} onPress={async () => { await alternarBloco(b.id, !b.concluido); reload(); }} />
                  </View>
                  <Text style={{ color: t.muted, marginTop: 4, fontSize: 13 }} numberOfLines={1}>{b.observacao || d?.nome || 'Matéria'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                    <Icon name="clock" size={12} color={t.muted} />
                    <Text style={{ color: t.muted, fontSize: 11, marginLeft: 4 }}>{dur || `${b.inicio}–${b.fim}`}</Text>
                    <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: cor, marginLeft: 10 }} />
                    <Text style={{ color: t.muted, fontSize: 11, marginLeft: 4, flex: 1 }}>{(d?.area || '').toLowerCase()}</Text>
                    <TouchableOpacity onPress={() => setEdit(b)} hitSlop={8} style={{ marginRight: 14 }}><Icon name="edit-2" size={15} color={t.accent} /></TouchableOpacity>
                    <TouchableOpacity hitSlop={8} onPress={() => Alert.alert('Excluir bloco?', undefined, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: async () => { await excluirBloco(b.id); reload(); } }])}>
                      <Icon name="trash-2" size={15} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      <ScheduleForm t={t} visible={form || !!edit} initial={edit || undefined} defaultDate={selected} discs={discs} onClose={() => { setForm(false); setEdit(null); }} reload={reload} />
    </ScrollView>
  );
}

function ScheduleForm({ t, visible, onClose, reload, initial, defaultDate, discs }: { t: Theme; visible: boolean; onClose: () => void; reload: () => void; initial?: CronogramaDb; defaultDate: string; discs: Disciplina[] }) {
  const [date, setDate] = useState(defaultDate);
  const [disc, setDisc] = useState('');
  const [ini, setIni] = useState('14:00');
  const [fim, setFim] = useState('15:00');
  const [titulo, setTitulo] = useState('');
  const [obs, setObs] = useState('');
  useEffect(() => {
    if (!visible) return;
    setDate(initial?.data || defaultDate);
    setDisc(initial?.disciplina_id || discs[0]?.id || '');
    setIni(initial?.inicio || '14:00');
    setFim(initial?.fim || '15:00');
    setTitulo(initial?.titulo || '');
    setObs(initial?.observacao || '');
  }, [visible, initial, defaultDate, discs]);

  const save = async () => {
    if (!date || !disc || !titulo.trim()) return Alert.alert('Preencha data, matéria e título');
    if (initial) await editarBloco(initial.id, disc, date, ini, fim, titulo, obs);
    else await adicionarBloco(disc, date, ini, fim, titulo, obs);
    onClose();
    reload();
  };

  return (
    <ModalBox visible={visible} onClose={onClose} t={t} title={initial ? 'Editar estudo' : 'Adicionar estudo'}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <DateTimeField t={t} label="Data" value={date} mode="date" onChange={setDate} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
          {discs.map((d) => <Chip key={d.id} t={t} label={d.nome} on={disc === d.id} onPress={() => setDisc(d.id)} />)}
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <DateTimeField t={t} label="Início" value={ini} mode="time" onChange={setIni} style={{ flex: 1 }} />
          <DateTimeField t={t} label="Fim" value={fim} mode="time" onChange={setFim} style={{ flex: 1 }} />
        </View>
        <Field t={t} value={titulo} onChangeText={setTitulo} placeholder="Título do estudo" />
        <Field t={t} value={obs} onChangeText={setObs} multiline placeholder="Observações" />
        <Btn t={t} label="Salvar no cronograma" onPress={save} />
      </ScrollView>
    </ModalBox>
  );
}

const s = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 14 },
  week: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24 },
  day: { width: 44, paddingTop: 9, paddingBottom: 7, borderRadius: 13, alignItems: 'center' },
  item: { flexDirection: 'row', paddingLeft: 24, paddingRight: 24, marginBottom: 14 },
  block: { flex: 1, borderRadius: 16, borderLeftWidth: 4, padding: 14, ...shadow },
});
