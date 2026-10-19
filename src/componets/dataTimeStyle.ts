import { StyleSheet } from 'react-native';
import { DIAS } from '../global/utils';

// Constantes compartilhadas pelos seletores de data e hora.
export const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
export const NOMES_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const st = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginLeft: 4 },
  box: { height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  valor: { fontSize: 15, flexShrink: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,5,40,0.6)', justifyContent: 'center', padding: 20 },
  caixa: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E4D9F2', width: '100%', maxWidth: 360, alignSelf: 'center' },
  titulo: { fontSize: 18, fontWeight: '800', color: '#2A1B3D', textAlign: 'center', marginBottom: 14 },
  num: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  seta: { fontSize: 26, color: '#7C37BE', fontWeight: '800', paddingHorizontal: 10 },
  navDia: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  navTxt: { color: '#7C37BE', fontWeight: '700', fontSize: 13, paddingHorizontal: 8, paddingVertical: 4 },
  rodape: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btnOk: { flex: 1, paddingVertical: 12, borderRadius: 24, backgroundColor: '#7C37BE', alignItems: 'center' },
  btnNo: { flex: 1, paddingVertical: 12, borderRadius: 24, backgroundColor: '#EEE6F8', alignItems: 'center' },
  txtOk: { color: '#FFFFFF', fontWeight: '700' },
  txtNo: { color: '#4A3B5C', fontWeight: '700' },
  secao: { color: '#8A7B99', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  faixa: { width: 46, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 8, backgroundColor: '#F1E9FA' },
});

export { DIAS };