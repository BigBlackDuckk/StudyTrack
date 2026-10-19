import React, { useEffect, useRef, useState } from 'react';
import { ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../global/theme';
import { Icon, IconName } from './ui';

type Passo = {
  icone: IconName;
  titulo: string;
  texto: string;
  dica?: string;
};

/** Passos na ordem em que o app realmente é usado. */
const PASSOS: Passo[] = [
  {
    icone: 'book-open',
    titulo: 'Bem-vindo ao StudyTrack',
    texto: 'Este app guarda seus estudos, metas e simulados em um só lugar. Tudo fica salvos só no seu aparelho, sem precisar de internet.',
    dica: 'Você pode tocar em Pular a qualquer momento.',
  },
  {
    icone: 'calendar',
    titulo: '1. Monte seu cronograma',
    texto: 'Na aba Cronograma, toque em Adicionar e escolha o dia e o horário tocando no calendário e no relógio.',
    dica: 'Com os lembretes ligados, você recebe um aviso na hora de cada bloco.',
  },
  {
    icone: 'clock',
    titulo: '2. Use o Foco Ativo',
    texto: 'Na aba Registro, escolha a matéria, aperte para iniciar e deixe o cronômetro rodando enquanto estuda.',
    dica: 'Ao terminar, toque em Encerrar para salvar o tempo estudado.',
  },
  {
    icone: 'award',
    titulo: '3. Crie suas metas',
    texto: 'Na aba Metas, escreva o que você quer conquistar e marque conforme for concluindo.',
    dica: 'Vale colocar metas pequenas e com prazo.',
  },
  {
    icone: 'file-text',
    titulo: '4. Guarde seus simulados',
    texto: 'Em Perfil, abra Meus simulados para guardar provas em PDF e revisar quando quiser.',
    dica: 'Você pode abrir o PDF sem precisar de internet.',
  },
];

export default function Tutorial({ t, visible, onClose }: { t: Theme; visible: boolean; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [largura, setLargura] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const ultimo = i === PASSOS.length - 1;

  // O botao Avancar precisa mover a rolagem de verdade. Sem isso o indicador
  // muda de pagina, mas o texto continua parado, fora de sincronia.
  useEffect(() => {
    if (largura > 0) scroller.current?.scrollTo({ x: i * largura, animated: true });
  }, [i, largura]);

  const fechar = () => {
    setI(0);
    onClose();
  };

  const proximo = () => {
    if (ultimo) return fechar();
    setI(i + 1);
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={fechar}>
      <ImageBackground source={require('../../assets/bg-app.png')} resizeMode="cover" style={{ flex: 1 }}>
        <View style={[st.topo, { paddingTop: 52 }]}>
          <Pressable onPress={fechar} hitSlop={12} style={st.pular}>
            <Text style={[st.pularTxt, { color: '#FFFFFF' }]}>Pular</Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
          onMomentumScrollEnd={(e) => {
            if (largura > 0) setI(Math.round(e.nativeEvent.contentOffset.x / largura));
          }}
        >
          {PASSOS.map((p) => (
            <View key={p.titulo} style={[st.pagina, { width: largura || undefined }]}>
              <View style={[st.icone, { backgroundColor: 'rgba(255,255,255,0.22)', borderColor: 'rgba(255,255,255,0.45)' }]}>
                <Icon name={p.icone} size={46} color="#FFFFFF" />
              </View>
              <Text style={st.titulo}>{p.titulo}</Text>
              <Text style={st.texto}>{p.texto}</Text>
              {!!p.dica && (
                <View style={st.dica}>
                  <Icon name="info" size={15} color="#FFFFFF" />
                  <Text style={st.dicaTxt}>{p.dica}</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={st.rodape}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 22 }}>
            {PASSOS.map((p, n) => (
              <View key={p.titulo} style={[st.ponto, { backgroundColor: n === i ? '#FFFFFF' : 'rgba(255,255,255,0.4)' }, n === i && { width: 22 }]} />
            ))}
          </View>

          <TouchableOpacity onPress={proximo} activeOpacity={0.9} style={st.btn}>
            <Text style={st.btnTxt}>{ultimo ? 'Começar a usar' : 'Avançar'}</Text>
            <Icon name="chevron-right" size={20} color="#2D2A7A" />
          </TouchableOpacity>

          <Text style={st.cont}>{i + 1} de {PASSOS.length}</Text>
        </View>
      </ImageBackground>
    </Modal>
  );
}

const st = StyleSheet.create({
  topo: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 8 },
  pular: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)' },
  pularTxt: { fontSize: 14, fontWeight: '700' },
  pagina: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34 },
  icone: { width: 108, height: 108, borderRadius: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 30 },
  titulo: { fontSize: 27, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', letterSpacing: -0.4 },
  texto: { fontSize: 15, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 14, lineHeight: 23 },
  dica: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 16, padding: 14, marginTop: 24 },
  dicaTxt: { color: '#FFFFFF', fontSize: 13, flex: 1, lineHeight: 19 },
  rodape: { paddingHorizontal: 24, paddingBottom: 44 },
  ponto: { width: 8, height: 8, borderRadius: 4 },
  btn: { height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnTxt: { color: '#2D2A7A', fontWeight: '700', fontSize: 16 },
  cont: { color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginTop: 14, fontSize: 12 },
});
