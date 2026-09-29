import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Btn, Card, Check, Field, Header, Icon, ModalBox, TopPill } from '../componets/ui';
import { Theme, TOP, shadow } from '../global/theme';
import { adicionarMeta, alternarMetaDb, editarMeta, excluirMeta } from '../services/studytrack';
import type { MetaDb } from '../services/studytrack';

export default function Metas({ t, metas, reload }: { t: Theme; metas: MetaDb[]; reload: () => void }) {
  const [form, setForm] = useState(false);
  const [edit, setEdit] = useState<MetaDb | null>(null);
  const done = metas.filter((m) => !!m.feita).length;
  const pct = metas.length ? Math.round((done / metas.length) * 100) : 0;

  return (
    <ScrollView contentContainerStyle={{ paddingTop: TOP, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
      <Header t={t} title="Metas" sub={`${done} de ${metas.length} concluídas`} right={<TopPill t={t} label="Nova meta" icon="plus" onPress={() => setForm(true)} />} />

      <View style={[s.resumo, { backgroundColor: t.card }]}>
        <Text style={{ color: '#EFE2FB', fontSize: 10, fontWeight: '600' }}>METAS CONCLUÍDAS</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '800' }}>{done}/{metas.length}</Text>
          <View style={s.pill}><Text style={{ color: t.bar, fontSize: 11, fontWeight: '700' }}>{pct}%</Text></View>
        </View>
        <View style={s.track}><View style={{ width: `${pct}%`, height: 6, borderRadius: 3, backgroundColor: '#F59E0B' }} /></View>
      </View>

      {metas.length === 0 && <Card t={t}><Text style={{ color: t.muted }}>Nenhuma meta ainda. Toque em "Nova meta" para começar.</Text></Card>}
      {metas.map((m) => (
        <View key={m.id} style={[s.meta, { backgroundColor: m.feita ? 'rgba(255,255,255,0.6)' : '#FFFFFF' }]}>
          <Check t={t} on={!!m.feita} onPress={async () => { await alternarMetaDb(m.id, !m.feita); reload(); }} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ color: m.feita ? t.muted : t.text, fontWeight: '700', fontSize: 15, textDecorationLine: m.feita ? 'line-through' : 'none' }}>{m.texto}</Text>
            {!!m.observacao && <Text style={{ color: t.muted, fontSize: 12, marginTop: 4 }}>{m.observacao}</Text>}
            {!!m.foto && <Image source={{ uri: m.foto }} style={{ width: 72, height: 72, borderRadius: 12, marginTop: 8 }} />}
          </View>
          <TouchableOpacity onPress={() => setEdit(m)} hitSlop={8} style={{ marginRight: 14 }}><Icon name="edit-2" size={17} color={t.accent} /></TouchableOpacity>
          <TouchableOpacity hitSlop={8} onPress={() => Alert.alert('Excluir meta?', undefined, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: async () => { await excluirMeta(m.id); reload(); } }])}>
            <Icon name="trash-2" size={17} color="#DC2626" />
          </TouchableOpacity>
        </View>
      ))}

      <MetaForm t={t} visible={form || !!edit} initial={edit || undefined} onClose={() => { setForm(false); setEdit(null); }} reload={reload} />
    </ScrollView>
  );
}

function MetaForm({ t, visible, onClose, reload, initial }: { t: Theme; visible: boolean; onClose: () => void; reload: () => void; initial?: MetaDb }) {
  const [texto, setTexto] = useState('');
  const [obs, setObs] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  useEffect(() => {
    if (!visible) return;
    setTexto(initial?.texto || '');
    setObs(initial?.observacao || '');
    setFoto(initial?.foto || null);
  }, [visible, initial]);

  const save = async () => {
    if (!texto.trim()) return Alert.alert('Digite a meta');
    if (initial) await editarMeta(initial.id, texto, obs, foto);
    else await adicionarMeta(texto, obs, foto || undefined);
    onClose();
    reload();
  };
  return (
    <ModalBox visible={visible} onClose={onClose} t={t} title={initial ? 'Editar meta' : 'Nova meta'}>
      <Field t={t} value={texto} onChangeText={setTexto} placeholder="O que você quer alcançar?" />
      <Field t={t} value={obs} onChangeText={setObs} multiline placeholder="Como pretende alcançar / observações" />
      <Btn t={t} label={foto ? 'Trocar foto' : 'Adicionar foto'} icon="image" kind="secondary" onPress={async () => {
        const r = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
        if (!r.canceled) setFoto(r.assets[0].uri);
      }} />
      {!!foto && <Image source={{ uri: foto }} style={{ width: 100, height: 100, borderRadius: 12, marginTop: 10 }} />}
      <Btn t={t} label="Salvar meta" onPress={save} />
    </ModalBox>
  );
}

const s = StyleSheet.create({
  resumo: { marginHorizontal: 24, marginBottom: 18, borderRadius: 16, padding: 16, ...shadow },
  pill: { marginLeft: 12, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.85)', marginTop: 14, overflow: 'hidden' },
  meta: { marginHorizontal: 24, marginBottom: 10, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
});
