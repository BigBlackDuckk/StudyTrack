import React, { useState } from 'react';
import { Alert, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { WebView } from 'react-native-webview';
import { Btn, Card, Chip, Field, Header, Icon } from '../componets/ui';
import { LIGHT, Theme, TOP, areaColor, shadow } from '../global/theme';
import { Disciplina, fmtDate } from '../global/utils';
import { adicionarSimulado, excluirSimulado } from '../services/studytrack';
import type { SimuladoDb } from '../services/studytrack';

export default function Simulados({ t, discs, sims, reload, onBack }: { t: Theme; discs: Disciplina[]; sims: SimuladoDb[]; reload: () => void; onBack: () => void }) {
  const [materia, setMateria] = useState('');
  const [title, setTitle] = useState('');
  const [open, setOpen] = useState<SimuladoDb | null>(null);
  const escolhida = discs.find((d) => d.id === materia) || discs[0];

  const pick = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (r.canceled) return;
    const a = r.assets[0];
    await adicionarSimulado(title || a.name.replace(/\.pdf$/i, ''), escolhida?.nome || '', a.uri);
    setTitle('');
    reload();
  };

  return (
    <ScrollView contentContainerStyle={{ paddingTop: TOP, paddingBottom: 28 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Header t={t} title="Simulados" sub="PDFs salvos no StudyTrack" onBack={onBack} />

      <Card t={t}>
        <Text style={{ color: t.text, fontWeight: '800' }}>Novo simulado</Text>
        <Field t={t} value={title} onChangeText={setTitle} placeholder="Nome do simulado (opcional)" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {discs.map((d) => <Chip key={d.id} t={t} label={d.nome} on={d.id === escolhida?.id} onPress={() => setMateria(d.id)} />)}
        </ScrollView>
        <Btn t={t} label="Inserir PDF" icon="upload" onPress={pick} />
      </Card>

      {sims.length === 0 && <Card t={t}><Text style={{ color: t.muted }}>Nenhum simulado salvo ainda.</Text></Card>}
      {sims.map((sm) => {
        const cor = areaColor(discs.find((d) => d.nome === sm.materia)?.area);
        return (
          <View key={sm.id} style={[s.item, { backgroundColor: t.surface, borderLeftColor: cor }]}>
            <View style={[s.icon, { backgroundColor: t.line }]}><Icon name="file-text" size={20} color={t.primary} /></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: t.text, fontWeight: '800', fontSize: 15 }} numberOfLines={1}>{sm.titulo}</Text>
              <Text style={{ color: t.muted, fontSize: 12, marginTop: 3 }}>{sm.materia || 'Sem matéria'} · {fmtDate(sm.data_adicionado)}</Text>
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
