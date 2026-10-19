import React from 'react';
import { Image, Modal, Platform, Pressable, StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme, TOP, shadow } from '../global/theme';
import type { Aba, Usuario } from '../global/utils';

export type IconName = React.ComponentProps<typeof Feather>['name'];

export function Icon({ name, size = 20, color = '#000' }: { name: IconName; size?: number; color?: string }) {
  return <Feather name={name} size={size} color={color} />;
}

export function Card({ t, children, onPress, style }: { t: Theme; children: React.ReactNode; onPress?: () => void; style?: any }) {
  const C: any = onPress ? TouchableOpacity : View;
  return (
    <C onPress={onPress} activeOpacity={0.85} style={[s.card, { backgroundColor: t.surface }, style]}>
      {children}
    </C>
  );
}

export function Btn({ t, label, onPress, kind = 'primary', small = false, icon, style }: {
  t: Theme; label: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'white'; small?: boolean; icon?: IconName; style?: any;
}) {
  const bg = kind === 'primary' ? t.primary : kind === 'danger' ? '#DC2626' : kind === 'secondary' ? t.line : kind === 'white' ? '#FFFFFF' : 'transparent';
  const fg = kind === 'primary' || kind === 'danger' ? '#FFFFFF' : kind === 'white' ? '#1B1035' : t.text;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[s.btn, { backgroundColor: bg, paddingVertical: small ? 9 : 14, paddingHorizontal: small ? 14 : 18, borderColor: t.line, borderWidth: kind === 'ghost' ? 1 : 0 }, style]}
    >
      {icon && <Icon name={icon} size={small ? 14 : 16} color={fg} />}
      {!!label && <Text style={{ color: fg, fontWeight: '700', fontSize: small ? 12 : 15, marginLeft: icon ? 7 : 0 }}>{label}</Text>}
    </TouchableOpacity>
  );
}

// Botão pílula translúcido do topo (como o "Otimizar" do molde).
export function TopPill({ label, onPress, icon, t }: { label: string; onPress: () => void; icon?: IconName; t: Theme }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={s.topPill}>
      {icon && <Icon name={icon} size={14} color={t.accent} />}
      <Text style={{ color: t.accent, fontWeight: '700', fontSize: 13, marginLeft: icon ? 5 : 0 }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Header({ t, title, sub, onBack, right }: { t: Theme; title: string; sub?: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <View style={s.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={{ marginRight: 8, marginLeft: -6 }} hitSlop={10}>
            <Icon name="chevron-left" size={28} color={t.title} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[s.h1, { color: t.title }]}>{title}</Text>
          {!!sub && <Text style={{ color: t.muted, marginTop: 3, fontSize: 14 }}>{sub}</Text>}
        </View>
      </View>
      {right}
    </View>
  );
}

export function SectionTitle({ t, children }: { t: Theme; children: string }) {
  return <Text style={[s.h2, { color: t.title }]}>{children}</Text>;
}

export function Avatar({ user, size = 44 }: { user: Usuario; size?: number }) {
  const box = { width: size, height: size, borderRadius: size / 2 };
  if (user.avatar) return <Image source={{ uri: user.avatar }} style={box} />;
  const ini = user.nome.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={[box, { backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: '#6A22A8', fontWeight: '800', fontSize: size * 0.36 }}>{ini}</Text>
    </View>
  );
}

// Checkbox arredondado roxo, igual ao de "Metas do Dia" no molde.
export function Check({ t, on, onPress }: { t: Theme; on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={8} style={[s.check, { borderColor: t.primary, backgroundColor: on ? '#EDE3FA' : 'transparent' }]}>
      {on && <Icon name="check" size={14} color={t.primary} />}
    </TouchableOpacity>
  );
}

export function Field(props: TextInputProps & { t: Theme }) {
  const { t, style, ...rest } = props;
  return <TextInput placeholderTextColor={t.muted} {...rest} style={[s.field, { backgroundColor: t.input, color: t.text, borderColor: t.line }, rest.multiline && s.fieldMulti, style]} />;
}

export function Chip({ t, label, on, onPress }: { t: Theme; label: string; on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, { backgroundColor: on ? t.accent : t.line }]}>
      <Text style={{ color: on ? '#FFFFFF' : t.text, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ModalBox({ visible, onClose, t, title, children }: { visible: boolean; onClose: () => void; t: Theme; title: string; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={[s.sheet, { backgroundColor: t.surface }]}>
          <View style={s.sheetHead}>
            <Text style={{ color: t.text, fontSize: 19, fontWeight: '800', flex: 1 }}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Icon name="x" size={24} color={t.text} />
            </TouchableOpacity>
          </View>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const NAV: [Aba, string, IconName][] = [
  ['inicio', 'Início', 'home'],
  ['cronograma', 'Cronograma', 'calendar'],
  ['registro', 'Registro', 'clock'],
  ['metas', 'Metas', 'award'],
  ['perfil', 'Perfil', 'user'],
];

export function Nav({ t, aba, go }: { t: Theme; aba: Aba; go: (a: Aba) => void }) {
  return (
    <View style={[s.nav, { backgroundColor: t.nav }]}>
      {NAV.map(([a, label, icon]) => {
        const c = aba === a ? t.navActive : '#FFFFFF';
        return (
          <TouchableOpacity key={a} onPress={() => go(a)} style={s.navItem} activeOpacity={0.7}>
            <Icon name={icon} size={22} color={c} />
            <Text style={{ fontSize: 10, color: c, marginTop: 4, fontWeight: '600' }}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export const s = StyleSheet.create({
  header: { paddingHorizontal: 24, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3 },
  h2: { fontSize: 18, fontWeight: '800', marginLeft: 24, marginBottom: 12 },
  card: { marginHorizontal: 24, marginBottom: 12, borderRadius: 16, padding: 16, ...shadow, shadowOpacity: 0.12, elevation: 3 },
  btn: { borderRadius: 28, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 10 },
  topPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.28)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)' },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  field: { height: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, marginTop: 10, fontSize: 15 },
  fieldMulti: { height: undefined, minHeight: 88, paddingTop: 12, textAlignVertical: 'top' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, marginRight: 6, marginVertical: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(20,5,40,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 28, maxHeight: '92%' },
  sheetHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  nav: { flexDirection: 'row', paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 30 : 14 },
  navItem: { flex: 1, alignItems: 'center' },
});

export { TOP };
