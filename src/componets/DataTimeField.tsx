import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Theme } from '../global/theme';
import { pad } from '../global/utils';
import { st } from './dataTimeStyle';
import { Icon } from './ui';
import Calendario from './Calendario';
import Relogio from './Relogio';

type Props = {
  t: Theme;
  label: string;
  value: string;   // data "AAAA-MM-DD" ou hora "HH:MM"
  mode: 'date' | 'time';
  onChange: (v: string) => void;
  style?: any;
};

/** "AAAA-MM-DD" -> Date local (sem tropeçar no fuso do UTC). */
export function parseData(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return new Date();
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** "HH:MM" -> minutos desde a meia-noite. */
export function parseHora(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return 14 * 60;
  return Math.min(23, Number(m[1])) * 60 + Math.min(59, Number(m[2]));
}

/**
 * Campo de data/hora que abre um seletor visual em vez de exigir digitação.
 * No celular usa o seletor nativo do sistema; no navegador usa um calendário
 * e um relógio próprios, já que esse componente não tem versão web.
 */
export default function DateTimeField({ t, label, value, mode, onChange, style }: Props) {
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState<Date | null>(null);

  const data = useMemo(() => (mode === 'date' ? parseData(value) : new Date()), [value, mode]);
  const minutos = useMemo(() => (mode === 'time' ? parseHora(value) : 14 * 60), [value, mode]);

  const rotulo =
    mode === 'date'
      ? data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      : `${pad(Math.floor(minutos / 60))}:${pad(minutos % 60)}`;

  const abrir = () => {
    setRascunho(mode === 'date' ? data : new Date(2020, 0, 1, Math.floor(minutos / 60), minutos % 60));
    setAberto(true);
  };

  const fechar = () => {
    setAberto(false);
    setRascunho(null);
  };

  const confirmarData = (d: Date) => {
    fechar();
    onChange(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  };

  const confirmarHora = (d: Date) => {
    fechar();
    onChange(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
  };

  return (
    <View style={style}>
      <Text style={[st.label, { color: t.muted }]}>{label}</Text>

      {aberto && Platform.OS !== 'web' && (
        <DateTimePicker
          value={data}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={mode === 'date' ? new Date() : undefined}
          onChange={(e, escolhido) => {
            if (Platform.OS === 'android') fechar();
            if (!escolhido) return;
            if (mode === 'date') confirmarData(escolhido);
            else confirmarHora(escolhido);
          }}
        />
      )}

      {aberto && Platform.OS === 'web' && rascunho && (
        <Modal visible transparent animationType="fade" onRequestClose={fechar}>
          <Pressable style={st.backdrop} onPress={fechar}>
            <Pressable style={st.caixa} onPress={(e) => e.stopPropagation()}>
              {mode === 'date' ? (
                <Calendario
                  data={rascunho}
                  setData={setRascunho}
                  onFechar={fechar}
                  onOk={(d) => {
                    fechar();
                    onChange(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
                  }}
                />
              ) : (
                <Relogio
                  hora={Math.floor(minutos / 60)}
                  minuto={minutos % 60}
                  onFechar={fechar}
                  onOk={(d) => {
                    fechar();
                    onChange(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
                  }}
                />
              )}
            </Pressable>
          </Pressable>
        </Modal>
      )}

      <Pressable onPress={abrir} style={[st.box, { backgroundColor: t.input, borderColor: t.line }]}>
        <Text style={[st.valor, { color: t.text }]} numberOfLines={1}>{rotulo}</Text>
        <Icon name={mode === 'date' ? 'calendar' : 'clock'} size={18} color={t.muted} />
      </Pressable>
    </View>
  );
}