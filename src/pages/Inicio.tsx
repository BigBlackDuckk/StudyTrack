import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Avatar, Icon } from '../componets/ui';
import { Theme, TOP, areaColor, shadow } from '../global/theme';
import { Aba, DIAS, Disciplina, Usuario, fmtDur, isoDate } from '../global/utils';
import { carregarStats, pctDisc } from './modals';
import type { MetaDb, RegistroDb, SimuladoDb } from '../services/studytrack';

type Props = {
  t: Theme; user: Usuario; discs: Disciplina[]; metas: MetaDb[]; sims: SimuladoDb[]; records: RegistroDb[];
  onAll: () => void; onSubject: (d: Disciplina) => void; onProgress: () => void; onSimulados: () => void; go: (a: Aba) => void;
};

export default function Inicio({ t, user, discs, metas, sims, records, onAll, onSubject, onProgress, onSimulados, go }: Props) {
  const [stats, setStats] = useState<Record<string, { total: number; done: number }>>({});
  useEffect(() => { carregarStats(discs).then(setStats); }, [discs]);

  const first = user.nome.split(' ')[0];
  const totalSec = records.reduce((a, r) => a + r.duracao, 0);
  const horas = totalSec >= 3600 ? `${Math.floor(totalSec / 3600)}h` : `${Math.floor(totalSec / 60)}min`;
  const feitas = metas.filter((x) => !!x.feita).length;
  const pctMetas = metas.length ? Math.round((feitas / metas.length) * 100) : 0;

  // Últimos 7 dias (o último é hoje).
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const key = isoDate(d);
    return { label: DIAS[d.getDay()], h: records.filter((r) => r.data.slice(0, 10) === key).reduce((a, r) => a + r.duracao, 0) / 3600 };
  });
  const max = Math.max(1, ...dias.map((d) => d.h));

  return (
    <ScrollView contentContainerStyle={{ paddingTop: TOP, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
      <View style={s.head}>
        <View style={{ flex: 1 }}>
          <Text style={[s.hello, { color: t.title }]}>Olá, {first} 👋</Text>
          <Text style={{ color: t.sub, marginTop: 4, fontSize: 15 }}>Pronto para os estudos de hoje?</Text>
        </View>
        <TouchableOpacity onPress={() => go('perfil')}>
          <Avatar user={user} size={46} />
        </TouchableOpacity>
      </View>

      <View style={s.stats}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => go('registro')} style={[s.stat, { backgroundColor: t.card }]}>
          <Text style={s.statLabel}>HORAS{'\n'}ESTUDADAS</Text>
          <Text style={s.statValue}>{horas}</Text>
          <View style={s.mini}>
            {dias.slice(2).map((d, i) => <View key={i} style={{ width: 4, height: 5 + (d.h / max) * 15, borderRadius: 2, backgroundColor: t.bar }} />)}
          </View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85} onPress={() => go('metas')} style={[s.stat, { backgroundColor: t.card }]}>
          <Text style={s.statLabel}>METAS{'\n'}CONCLUÍDAS</Text>
          <Text style={s.statValue}>{feitas}/{metas.length}</Text>
          <View style={s.pill}><Text style={{ color: t.bar, fontSize: 10, fontWeight: '700' }}>{pctMetas}%</Text></View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85} onPress={onSimulados} style={[s.stat, { backgroundColor: t.card }]}>
          <Text style={s.statLabel}>SIMULADOS</Text>
          <Text style={s.statValue}>{sims.length}</Text>
          <Text style={{ color: '#EFE2FB', fontSize: 10 }}>PDFs salvos</Text>
        </TouchableOpacity>
      </View>

      <Text style={[s.h2, { color: t.title }]}>Desempenho Semanal</Text>
      <TouchableOpacity activeOpacity={0.9} onPress={onProgress} style={[s.chart, { backgroundColor: t.chartBg }]}>
        <View style={s.bars}>
          {dias.map((d, i) => (
            <View key={i} style={{ alignItems: 'center', flex: 1 }}>
              <View style={{ width: 13, height: Math.max(10, (d.h / max) * 92), borderRadius: 7, backgroundColor: t.bar }} />
              <Text style={{ fontSize: 11, color: t.muted, marginTop: 8 }}>{d.label}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>

      <View style={s.sectionHead}>
        <Text style={[s.h2Inline, { color: t.title }]}>Disciplinas</Text>
        <TouchableOpacity onPress={onAll}><Text style={{ color: t.title, fontSize: 13 }}>Ver todas</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 6 }}>
        {discs.map((d) => (
          <TouchableOpacity key={d.id} activeOpacity={0.85} onPress={() => onSubject(d)} style={[s.disc, { backgroundColor: t.card, borderLeftColor: areaColor(d.area) }]}>
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }} numberOfLines={1}>{d.nome}</Text>
            <Text style={{ color: '#EFE2FB', fontSize: 11, marginTop: 3 }}>{d.area}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>{pctDisc(d, stats[d.id])}%</Text>
              <Icon name="arrow-right" size={17} color="#4F46E5" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 26 },
  hello: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3 },
  stats: { flexDirection: 'row', paddingHorizontal: 24, gap: 10, marginBottom: 26 },
  stat: { flex: 1, minHeight: 122, borderRadius: 16, padding: 12, ...shadow },
  statLabel: { color: '#EFE2FB', fontSize: 10, fontWeight: '600', lineHeight: 13 },
  statValue: { color: '#FFFFFF', fontSize: 23, fontWeight: '800', marginTop: 8, marginBottom: 8 },
  mini: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 22 },
  pill: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  h2: { fontSize: 18, fontWeight: '800', marginLeft: 24, marginBottom: 12 },
  h2Inline: { fontSize: 18, fontWeight: '800' },
  chart: { marginHorizontal: 24, borderRadius: 18, paddingVertical: 20, paddingHorizontal: 8, marginBottom: 28 },
  bars: { height: 122, flexDirection: 'row', alignItems: 'flex-end' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 12 },
  disc: { width: 152, borderRadius: 16, padding: 14, marginRight: 12, borderLeftWidth: 4, ...shadow },
});
