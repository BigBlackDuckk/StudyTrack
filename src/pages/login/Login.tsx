import React, { useState } from 'react';
import { Alert, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Icon } from '../../componets/ui';
import { registerUsuario, loginUsuario } from '../../database/database';
import { NIVEIS } from '../../global/utils';
import { TOP } from '../../global/theme';

const WHITE_SOFT = 'rgba(255,255,255,0.20)';
const WHITE_LINE = 'rgba(255,255,255,0.35)';

export function Marca() {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={s.logo}>
        <Icon name="book-open" size={34} color="#FFFFFF" />
      </View>
      <Text style={s.brand}>StudyTrack</Text>
      <Text style={s.sub}>Seu copiloto acadêmico</Text>
    </View>
  );
}

export function Splash() {
  return (
    <ImageBackground source={require('../../../assets/bg-login.png')} resizeMode="cover" style={s.root}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Marca />
      </View>
    </ImageBackground>
  );
}

export default function Login({ onAuth }: { onAuth: (u: any) => void }) {
  const [create, setCreate] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [nivel, setNivel] = useState('');
  const [idade, setIdade] = useState('');
  const [sexo, setSexo] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setName(''); setEmail(''); setPass(''); setNivel(''); setIdade(''); setSexo('');
  };

  const submit = async () => {
    const e = email.trim().toLowerCase();
    if (!e || !/^\S+@\S+\.\S+$/.test(e)) return Alert.alert('E-mail inválido', 'Digite um e-mail real, por exemplo nome@gmail.com.');
    if (pass.length < 6) return Alert.alert('Senha inválida', 'A senha precisa ter pelo menos 6 caracteres.');
    if (create && !name.trim()) return Alert.alert('Falta seu nome', 'Digite seu nome para criar a conta.');
    if (create && !nivel) return Alert.alert('Escolaridade', 'Escolha sua escolaridade.');
    setBusy(true);
    try {
      const u = create ? await registerUsuario(name, e, pass, nivel, idade, sexo) : await loginUsuario(e, pass);
      reset();
      onAuth(u);
    } catch (err: any) {
      Alert.alert(create ? 'Não foi possível criar a conta' : 'Não foi possível entrar', err?.message || 'Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ImageBackground source={require('../../../assets/bg-login.png')} resizeMode="cover" style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ marginTop: 20, marginBottom: 44 }}>
            <Marca />
          </View>

          {create && (
            <>
              <Text style={s.label}>NOME</Text>
              <TextInput value={name} onChangeText={setName} placeholder="Seu nome" placeholderTextColor="rgba(255,255,255,0.6)" style={s.input} />
              <Text style={s.label}>ESCOLARIDADE</Text>
              <View style={s.wrap}>
                {NIVEIS.map((v) => (
                  <TouchableOpacity key={v} onPress={() => setNivel(v)} style={[s.chip, nivel === v && { backgroundColor: '#FFFFFF' }]}>
                    <Text style={{ color: nivel === v ? '#4A0B72' : '#FFFFFF', fontSize: 12, fontWeight: '600' }}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>IDADE (OPCIONAL)</Text>
                  <TextInput value={idade} onChangeText={setIdade} keyboardType="numeric" placeholder="17" placeholderTextColor="rgba(255,255,255,0.6)" style={s.input} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>SEXO (OPCIONAL)</Text>
                  <TextInput value={sexo} onChangeText={setSexo} placeholder="—" placeholderTextColor="rgba(255,255,255,0.6)" style={s.input} />
                </View>
              </View>
            </>
          )}

          <Text style={s.label}>E-MAIL</Text>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="voce@escola.com" placeholderTextColor="rgba(255,255,255,0.6)" style={s.input} />

          <Text style={s.label}>SENHA</Text>
          <View>
            <View style={s.lock}>
              <Icon name="lock" size={17} color="rgba(255,255,255,0.85)" />
            </View>
            <TextInput value={pass} onChangeText={setPass} secureTextEntry={!showPass} placeholder="••••••••" placeholderTextColor="rgba(255,255,255,0.6)" style={[s.input, { paddingLeft: 48, paddingRight: 50 }]} />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eye} hitSlop={10}>
              <Icon name={showPass ? 'eye-off' : 'eye'} size={18} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity disabled={busy} onPress={submit} activeOpacity={0.85} style={[s.enter, { opacity: busy ? 0.65 : 1 }]}>
            <Text style={{ color: '#2D2A7A', fontWeight: '700', fontSize: 16 }}>{busy ? 'Aguarde...' : create ? 'Criar conta' : 'Entrar'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setCreate(!create); reset(); }} style={{ alignItems: 'center', paddingTop: 22 }}>
            <Text style={{ color: '#FFFFFF', textDecorationLine: 'underline', fontSize: 14 }}>{create ? 'Já tenho uma conta' : 'Criar nova conta'}</Text>
          </TouchableOpacity>

          <Text style={s.footer}>Organize seus estudos. Conquiste seus objetivos.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 32, paddingTop: TOP + 30, paddingBottom: 34 },
  logo: { width: 64, height: 64, borderRadius: 18, backgroundColor: WHITE_SOFT, borderWidth: 1, borderColor: WHITE_LINE, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', marginTop: 16, letterSpacing: -0.5 },
  sub: { color: 'rgba(255,255,255,0.7)', marginTop: 4, fontSize: 14 },
  label: { color: '#FFFFFF', fontSize: 11, fontWeight: '600', marginTop: 16, marginBottom: 8, marginLeft: 4 },
  input: { height: 52, borderRadius: 26, paddingHorizontal: 20, backgroundColor: WHITE_SOFT, borderWidth: 1, borderColor: WHITE_LINE, color: '#FFFFFF', fontSize: 15 },
  lock: { position: 'absolute', left: 19, top: 0, bottom: 0, justifyContent: 'center', zIndex: 2 },
  eye: { position: 'absolute', right: 18, top: 0, bottom: 0, justifyContent: 'center', zIndex: 2 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18, backgroundColor: WHITE_SOFT, borderWidth: 1, borderColor: WHITE_LINE },
  enter: { height: 54, borderRadius: 27, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  footer: { color: '#FFFFFF', textAlign: 'center', fontSize: 13, marginTop: 44 },
});
