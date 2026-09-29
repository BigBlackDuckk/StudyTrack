import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Avatar, Btn, Chip, Field, Icon, ModalBox } from '../componets/ui';
import { Theme, TOP, shadow } from '../global/theme';
import { NIVEIS, Usuario } from '../global/utils';
import { getSetting, setSetting, updateUsuario } from '../database/database';

type Props = {
  t: Theme; user: Usuario; setUser: React.Dispatch<React.SetStateAction<Usuario>>; dark: boolean; setDark: (v: boolean) => void;
  onLogout: () => void; onSimulados: () => void;
};

const NOTIFS: [string, string, boolean][] = [
  ['notif_lembretes', 'Lembretes de Estudo', true],
  ['notif_resumo', 'Resumo Diário', true],
  ['notif_simulado', 'Alertas de Simulado', false],
];

const Grupo = ({ t, children }: { t: Theme; children: React.ReactNode }) => <View style={[s.group, { backgroundColor: t.surface }]}>{children}</View>;
const Label = ({ t, children }: { t: Theme; children: string }) => <Text style={[s.label, { color: t.label }]}>{children}</Text>;
const Linha = ({ t, children, last, onPress }: { t: Theme; children: React.ReactNode; last?: boolean; onPress?: () => void }) => {
  const C: any = onPress ? TouchableOpacity : View;
  return <C onPress={onPress} style={[s.row, !last && { borderBottomColor: t.line, borderBottomWidth: 1 }]}>{children}</C>;
};
const Sw = ({ t, value, onChange }: { t: Theme; value: boolean; onChange: (v: boolean) => void }) => (
  <Switch value={value} onValueChange={onChange} trackColor={{ false: '#E5E1EE', true: t.accent }} thumbColor="#FFFFFF" ios_backgroundColor="#E5E1EE" />
);

export default function Perfil({ t, user, setUser, dark, setDark, onLogout, onSimulados }: Props) {
  const [notif, setNotif] = useState<Record<string, boolean>>(Object.fromEntries(NOTIFS.map(([k, , d]) => [k, d])));
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.nome);
  const [nivel, setNivel] = useState(user.nivel);
  const [idade, setIdade] = useState(user.idade);
  const [sexo, setSexo] = useState(user.sexo);

  useEffect(() => {
    (async () => {
      const next: Record<string, boolean> = {};
      for (const [k, , d] of NOTIFS) {
        const v = await getSetting(k);
        next[k] = v == null ? d : v === '1';
      }
      setNotif(next);
    })().catch(() => {});
  }, []);

  const toggle = (k: string, v: boolean) => {
    setNotif((n) => ({ ...n, [k]: v }));
    setSetting(k, v ? '1' : '0').catch(() => {});
  };
  const abrirEdicao = () => { setName(user.nome); setNivel(user.nivel); setIdade(user.idade); setSexo(user.sexo); setEditing(true); };
  const salvar = async () => {
    if (!name.trim()) return Alert.alert('Digite seu nome');
    try {
      const n = await updateUsuario(user.id, { nome: name.trim(), nivel, idade, sexo });
      setUser((u) => ({ ...u, nome: n.nome, nivel: n.nivel || '', idade: n.idade || '', sexo: n.sexo || '' }));
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Não foi possível salvar', e?.message || 'Tente novamente.');
    }
  };
  const trocarFoto = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
    if (r.canceled) return;
    const uri = r.assets[0].uri;
    try {
      const n = await updateUsuario(user.id, { avatar: uri });
      setUser((u) => ({ ...u, avatar: n.avatar || uri }));
    } catch (e: any) {
      Alert.alert('Não foi possível salvar a foto', e?.message || 'Tente novamente.');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ paddingTop: TOP - 8, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
      <View style={s.head}>
        <TouchableOpacity onPress={trocarFoto} activeOpacity={0.85}><Avatar user={user} size={64} /></TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ color: t.bar, fontSize: 19, fontWeight: '800' }} numberOfLines={1}>{user.nome}</Text>
          <Text style={{ color: t.muted, fontSize: 13, marginTop: 3 }} numberOfLines={1}>{user.email}</Text>
        </View>
        <TouchableOpacity onPress={abrirEdicao} style={s.editBtn}><Text style={{ color: '#1B1035', fontWeight: '700', fontSize: 13 }}>Editar</Text></TouchableOpacity>
      </View>

      <Label t={t}>NOTIFICAÇÕES</Label>
      <Grupo t={t}>
        {NOTIFS.map(([k, nome], i) => (
          <Linha t={t} key={k} last={i === NOTIFS.length - 1}>
            <Text style={[s.rowText, { color: t.text }]}>{nome}</Text>
            <Sw t={t} value={notif[k]} onChange={(v) => toggle(k, v)} />
          </Linha>
        ))}
      </Grupo>

      <Label t={t}>PREFERÊNCIAS</Label>
      <Grupo t={t}>
        <Linha t={t}>
          <Text style={[s.rowText, { color: t.text }]}>Modo Escuro</Text>
          <Sw t={t} value={dark} onChange={setDark} />
        </Linha>
        <Linha t={t} last onPress={abrirEdicao}>
          <Text style={[s.rowText, { color: t.text }]}>Nível Escolar</Text>
          <Text style={{ color: t.muted, fontSize: 13, marginRight: 6, flexShrink: 1 }} numberOfLines={1}>{user.nivel || 'Não informado'}</Text>
          <Icon name="chevron-down" size={16} color={t.text} />
        </Linha>
      </Grupo>

      <Label t={t}>MATERIAL</Label>
      <Grupo t={t}>
        <Linha t={t} last onPress={onSimulados}>
          <Text style={[s.rowText, { color: t.text }]}>Meus simulados (PDFs)</Text>
          <Icon name="chevron-right" size={18} color={t.muted} />
        </Linha>
      </Grupo>

      <Label t={t}>SINCRONIZAÇÃO</Label>
      <Grupo t={t}>
        <Linha t={t} last>
          <Icon name="cloud" size={18} color={t.good} />
          <Text style={[s.rowText, { color: t.text, marginLeft: 10 }]}>Dados no aparelho</Text>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: t.good, marginRight: 6 }} />
          <Text style={{ color: t.good, fontWeight: '700', fontSize: 13 }}>Salvo</Text>
        </Linha>
      </Grupo>

      <TouchableOpacity style={s.link} onPress={() => Alert.alert('StudyTrack', 'Seu copiloto acadêmico.\nVersão 1.0.0')}>
        <Text style={{ color: t.muted, flex: 1, fontSize: 15 }}>Sobre o StudyTrack</Text>
        <Icon name="arrow-right" size={17} color={t.muted} />
      </TouchableOpacity>
      <TouchableOpacity style={s.link} onPress={onLogout}>
        <Text style={{ color: t.sub, flex: 1, fontSize: 15, fontWeight: '700' }}>Sair da Conta</Text>
        <Icon name="log-out" size={17} color={t.sub} />
      </TouchableOpacity>

      <ModalBox visible={editing} onClose={() => setEditing(false)} t={t} title="Editar perfil">
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Btn t={t} label="Trocar foto" icon="camera" kind="secondary" small onPress={trocarFoto} style={{ alignSelf: 'flex-start' }} />
          <Field t={t} value={name} onChangeText={setName} placeholder="Seu nome" />
          <Text style={[s.mLabel, { color: t.text }]}>Escolaridade</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{NIVEIS.map((v) => <Chip key={v} t={t} label={v} on={nivel === v} onPress={() => setNivel(v)} />)}</View>
          <Text style={[s.mLabel, { color: t.text }]}>Idade</Text>
          <Field t={t} value={idade} onChangeText={setIdade} keyboardType="numeric" placeholder="Ex.: 17" style={{ marginTop: 6 }} />
          <Text style={[s.mLabel, { color: t.text }]}>Sexo</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{['Feminino', 'Masculino', 'Outro', 'Prefiro não informar'].map((v) => <Chip key={v} t={t} label={v} on={sexo === v} onPress={() => setSexo(v)} />)}</View>
          <Btn t={t} label="Salvar" onPress={salvar} />
        </ScrollView>
      </ModalBox>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 26 },
  editBtn: { backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 8, ...shadow, shadowOpacity: 0.1, elevation: 2 },
  label: { fontSize: 11, fontWeight: '600', marginLeft: 24, marginBottom: 8, marginTop: 4 },
  group: { marginHorizontal: 24, borderRadius: 14, marginBottom: 20, overflow: 'hidden' },
  row: { minHeight: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  rowText: { flex: 1, fontSize: 15 },
  link: { marginHorizontal: 24, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' },
  mLabel: { fontWeight: '700', marginTop: 16 },
});
