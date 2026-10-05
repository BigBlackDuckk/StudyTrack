import { Text, TouchableOpacity, View } from 'react-native';
import { DIAS, MESES, MESES_CURTOS, NOMES_SEMANA, st } from './dataTimeStyle';
import Rodape from './Rodape';

/** Calendário mensal para escolher o dia por toque. */
export default function Calendario({
  data,
  setData,
  onFechar,
  onOk,
}: {
  data: Date;
  setData: (d: Date) => void;
  onFechar: () => void;
  onOk: (d: Date) => void;
}) {
  const ano = data.getFullYear();
  const mes = data.getMonth();
  const dia = data.getDate();
  const total = new Date(ano, mes + 1, 0).getDate();
  const hoje = new Date();
  const ehHoje = ano === hoje.getFullYear() && mes === hoje.getMonth() && dia === hoje.getDate();

  // Células alinhadas ao domingo, com espaço vazio antes do dia 1.
  const celulas: (number | null)[] = [
    ...Array.from({ length: new Date(ano, mes, 1).getDay() }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  const trocarMes = (delta: number) => {
    const d = new Date(ano, mes + delta, 1);
    setData(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const cx = (on: boolean) => [st.num, on ? { backgroundColor: '#7C37BE' } : null];

  return (
    <>
      <Text style={st.titulo}>{MESES[mes]} {ano}</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <TouchableOpacity onPress={() => trocarMes(-1)}><Text style={st.seta}>‹</Text></TouchableOpacity>
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
          {Array.from({ length: 5 }, (_, i) => {
            const m2 = mes - 2 + i;
            const r = ((m2 % 12) + 12) % 12;
            const a2 = ano + Math.floor(m2 / 12);
            return (
              <TouchableOpacity key={i} onPress={() => setData(new Date(a2, r, 1))} style={cx(r === mes)}>
                <Text style={{ color: r === mes ? '#FFFFFF' : '#4A3B5C', fontWeight: r === mes ? '800' : '600', fontSize: 12 }}>
                  {MESES_CURTOS[r]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity onPress={() => trocarMes(1)}><Text style={st.seta}>›</Text></TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        {DIAS.map((d) => (
          <Text key={d} style={{ width: 40, textAlign: 'center', color: '#8A7B99', fontSize: 11, fontWeight: '700' }}>
            {d.slice(0, 1)}
          </Text>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {celulas.map((c, i) => {
          if (c === null) return <View key={`v${i}`} style={{ width: 40, height: 40 }} />;
          const on = c === dia;
          const mark = ehHoje && c === hoje.getDate();
          return (
            <TouchableOpacity key={c} onPress={() => setData(new Date(ano, mes, c))} style={cx(on)}>
              <Text style={{
                color: on ? '#FFFFFF' : mark ? '#7C37BE' : '#3A2A4A',
                fontWeight: on || mark ? '800' : '500',
                fontSize: 14,
              }}>
                {c}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={st.navDia}>
        <TouchableOpacity onPress={() => setData(new Date(hoje))}><Text style={st.navTxt}>Hoje</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setData(new Date(hoje.getTime() + 86400000))}><Text style={st.navTxt}>Amanhã</Text></TouchableOpacity>
      </View>

      <Text style={{ textAlign: 'center', color: '#4A3B5C', marginTop: 6, fontWeight: '600' }}>
        {NOMES_SEMANA[new Date(ano, mes, dia).getDay()]}, {dia} de {MESES[mes]}
      </Text>

      <Rodape onFechar={onFechar} onOk={() => onOk(new Date(ano, mes, dia))} />
    </>
  );
}