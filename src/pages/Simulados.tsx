import React, { useEffect, useState } from 'react';
import { Alert, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { WebView } from 'react-native-webview';
import { Btn, Card, Chip, Field, Header, Icon } from '../componets/ui';
import { LIGHT, Theme, TOP, areaColor, shadow } from '../global/theme';
import { Disciplina, fmtDate } from '../global/utils';
import { adicionarSimulado, definirDisciplinasDeSimulado, disciplinasDeSimulado, excluirSimulado } from '../services/studytrack';
import type { SimuladoDb } from '../services/studytrack';

export default function Simulados({ t, discs, sims, reload, onBack }: { t: Theme; discs: Disciplina[]; sims: SimuladoDb[]; reload: () => void; onBack: () => void }) {
  const [materias, setMaterias] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [open, setOpen] = useState<SimuladoDb | null>(null);
  const [vinc, setVinc] = useState<Record<string, string[]>>({});
  useEffect(() => {
    (async () => {
      const x: Record<string, string[]> = {};
      for (const sm of sims) x[sm.id] = (await disciplinasDeSimulado(sm.id)).map((d) => d.nome);
      setVinc(x);
    })();
  }, [sims.map((s) => s.id).join(',')]);

  const toggle = (id: string) => setMaterias((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));

  const pick = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (r.canceled) return;
    const a = r.assets[0];
    const escolhidas = discs.filter((d) => materias.includes(d.id));
    const primeira = escolhidas[0] || discs[0];
    const sid = await adicionarSimulado(title || a.name.replace(/\.pdf$/i, ''), primeira?.nome || '', a.uri);
    if (escolhidas.length) await definirDisciplinasDeSimulado(sid, escolhidas.map((d) => d.id));
    setTitle('');
    setMaterias([]);
    reload();
  };

  return (
    <ScrollView contentContainerStyle={{ paddingTop: TOP, paddingBottom: 28 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Header t={t} title="Simulados" sub="PDFs salvos no StudyTrack" onBack={onBack} />

      <Card t={t}>
        <Text style={{ color: t.text, fontWeight: '800' }}>Novo simulado</Text>
        <Field t={t} value={title} onChangeText={setTitle} placeholder="Nome do simulado (opcional)" />
        <Text style={{ color: t.muted, fontSize: 12, marginTop: 10 }}>Matérias (pode marcar várias)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
          {discs.map((d) => <Chip key={d.id} t={t} label={d.nome} on={materias.includes(d.id)} onPress={() => toggle(d.id)} />)}
        </ScrollView>
        <Btn t={t} label="Inserir PDF" icon="upload" onPress={pick} />
      </Card>

      {sims.length === 0 && <Card t={t}><Text style={{ color: t.muted }}>Nenhum simulado salvo ainda.</Text></Card>}
      {sims.map((sm) => {
        const nomes = vinc[sm.id] && vinc[sm.id].length ? vinc[sm.id] : (sm.materia ? [sm.materia] : []);
        const cor = areaColor(discs.find((d) => d.nome === nomes[0])?.area);
        return (
          <View key={sm.id} style={[s.item, { backgroundColor: t.surface, borderLeftColor: cor }]}>
            <View style={[s.icon, { backgroundColor: t.line }]}><Icon name="file-text" size={20} color={t.primary} /></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: t.text, fontWeight: '800', fontSize: 15 }} numberOfLines={1}>{sm.titulo}</Text>
              <Text style={{ color: t.muted, fontSize: 12, marginTop: 3 }}>{nomes.length ? nomes.join(' · ') : 'Sem matéria'} · {fmtDate(sm.data_adicionado)}</Text>
            </View>
            <Btn t={t} label="Abrir" small style={{ marginTop: 0, marginRight: 10 }} onPress={() => setOpen(sm)} />
            <TouchableOpacity hitSlop={8} onPress={() => Alert.alert('Excluir PDF?', undefined, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: async () => { await excluirSimulado(sm.id); reload(); } }])}>
              <Icon name="trash-2" size={17} color="#DC2626" />
            </TouchableOpacity>
          </View>
        );
      })}

      <Modal visible={!!open} animationType="slide" onRequestClose={() => setOpen(null)}>
        <View style={{ flex: 1, backgroundColor: t.nav, paddingTop: Platform.OS === 'ios' ? 50 : 20 }}>
          <View style={s.viewerHead}>
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16, flex: 1 }} numberOfLines={1}>{open?.titulo}</Text>
            <TouchableOpacity onPress={() => setOpen(null)} hitSlop={10}><Icon name="x" size={26} color="#FFFFFF" /></TouchableOpacity>
          </View>
          {open && Platform.OS !== 'web' ? (
            <WebView source={{ uri: open.arquivo }} style={{ flex: 1 }} originWhitelist={['*']} allowFileAccess allowUniversalAccessFromFileURLs />
          ) : (
            open && (
              <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <Text style={{ color: '#1B1035', fontSize: 16, fontWeight: '700', textAlign: 'center' }}>No navegador, o PDF abre em uma nova aba.</Text>
                <Btn t={LIGHT} label="Abrir PDF" onPress={() => Linking.openURL(open.arquivo)} />
              </View>
            )
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  item: { marginHorizontal: 24, marginBottom: 12, borderRadius: 16, borderLeftWidth: 4, padding: 14, flexDirection: 'row', alignItems: 'center', ...shadow, shadowOpacity: 0.12, elevation: 3 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  viewerHead: { height: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18 },
});
