import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { st } from './dataTimeStyle';
import Rodape from './Rodape';

/** Relógio com faixas roláveis de horas e minutos, para não digitar nada. */
export default function Relogio({
  hora,
  minuto,
  onFechar,
  onOk,
}: {
  hora: number;
  minuto: number;
  onFechar: () => void;
  onOk: (d: Date) => void;
}) {
  const [h, setH] = useState(hora);
  const [m, setM] = useState(minuto);

  const dois = (n: number) => String(n).padStart(2, '0');
  const agora = new Date();
  const jaPassou = h * 60 + m <= agora.getHours() * 60 + agora.getMinutes();

  return (
    <>
      <Text style={st.titulo}>Escolha o horário</Text>

      <Text style={st.secao}>HORAS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 52 }}>
        {Array.from({ length: 24 }, (_, i) => (
          <TouchableOpacity key={i} onPress={() => setH(i)} style={[st.faixa, h === i && { backgroundColor: '#7C37BE' }]}>
            <Text style={{ color: h === i ? '#FFFFFF' : '#3A2A4A', fontWeight: h === i ? '800' : '600' }}>{dois(i)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={[st.secao, { marginTop: 14 }]}>MINUTOS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 52 }}>
        {Array.from({ length: 12 }, (_, i) => i * 5).map((v) => (
          <TouchableOpacity key={v} onPress={() => setM(v)} style={[st.faixa, m === v && { backgroundColor: '#7C37BE' }]}>
            <Text style={{ color: m === v ? '#FFFFFF' : '#3A2A4A', fontWeight: m === v ? '800' : '600' }}>{dois(v)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 12 }}>
        <Text style={{ color: '#8A7B99', fontSize: 28, fontWeight: '800' }}>{dois(h)}</Text>
        <Text style={{ color: '#8A7B99', fontSize: 28, fontWeight: '800' }}>:</Text>
        <Text style={{ color: '#8A7B99', fontSize: 28, fontWeight: '800' }}>{dois(m)}</Text>
      </View>

      <Text style={{ color: '#8A7B99', fontSize: 12, textAlign: 'center', marginTop: 4 }}>
        {jaPassou ? 'Esse horário de hoje já passou.' : 'Toque para ajustar'}
      </Text>

      <Rodape onFechar={onFechar} onOk={() => onOk(new Date(2020, 0, 1, h, m))} />
    </>
  );
}