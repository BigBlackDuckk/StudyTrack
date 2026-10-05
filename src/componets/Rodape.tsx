import { Text, TouchableOpacity, View } from 'react-native';
import { st } from './dataTimeStyle';

/** Botões Cancelar / Confirmar usados nos seletores web. */
export default function Rodape({ onFechar, onOk }: { onFechar: () => void; onOk: () => void }) {
  return (
    <View style={st.rodape}>
      <TouchableOpacity style={st.btnNo} onPress={onFechar}>
        <Text style={st.txtNo}>Cancelar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={st.btnOk} onPress={onOk}>
        <Text style={st.txtOk}>Confirmar</Text>
      </TouchableOpacity>
    </View>
  );
}