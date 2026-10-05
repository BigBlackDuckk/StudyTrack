import React, { useEffect, useState } from 'react';
import { ImageBackground, StatusBar, View } from 'react-native';
import { getSessaoUsuario, getSetting, logoutUsuario, seedDatabase, setSetting } from './src/database/database';
import { listarCronograma, listarDisciplinas, listarMetas, listarSimulados, listarTodosRegistros } from './src/services/studytrack';
import type { CronogramaDb, MetaDb, RegistroDb, SimuladoDb } from './src/services/studytrack';
import { agendar as agendarNotificacoes, cancelarTudo } from './src/services/notificacoes';
import { DARK, LIGHT } from './src/global/theme';
import { Aba, Disciplina, Tela, Usuario } from './src/global/utils';
import { useTimer } from './src/global/useTimer';
import { Nav } from './src/componets/ui';
import Login, { Splash } from './src/pages/login/Login';
import Tutorial from './src/componets/Tutorial';
import Inicio from './src/pages/Inicio';
import Cronograma from './src/pages/Cronograma';
import Registro from './src/pages/Registro';
import Metas from './src/pages/Metas';
import Simulados from './src/pages/Simulados';
import Perfil from './src/pages/Perfil';
import { ProgressModal, SubjectModal, SubjectsModal } from './src/pages/modals';

const VAZIO: Usuario = { id: '', nome: '', email: '', nivel: '', idade: '', sexo: '', avatar: null };
const toUser = (u: any): Usuario => ({ id: u.id, nome: u.nome, email: u.email, nivel: u.nivel || '', idade: u.idade || '', sexo: u.sexo || '', avatar: u.avatar || null });

export default function App() {
  const [booting, setBooting] = useState(true);
  const [logged, setLogged] = useState(false);
  const [tela, setTela] = useState<Tela>('inicio');
  const [voltarPara, setVoltarPara] = useState<Aba>('perfil');
  const [dark, setDark] = useState(false);
  const t = dark ? DARK : LIGHT;

  const [user, setUser] = useState<Usuario>(VAZIO);
  const [discs, setDiscs] = useState<Disciplina[]>([]);
  const [metas, setMetas] = useState<MetaDb[]>([]);
  const [blocks, setBlocks] = useState<CronogramaDb[]>([]);
  const [sims, setSims] = useState<SimuladoDb[]>([]);
  const [records, setRecords] = useState<RegistroDb[]>([]);
  const [selectedDisc, setSelectedDisc] = useState<Disciplina | null>(null);
  const [progressOpen, setProgressOpen] = useState(false);
  const [allSubjectsOpen, setAllSubjectsOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [tutorial, setTutorial] = useState(false);
  const timer = useTimer();

  useEffect(() => {
    (async () => {
      try {
        await seedDatabase();
        const [session, tema] = await Promise.all([getSessaoUsuario(), getSetting('tema')]);
        if (tema) setDark(tema === 'dark');
        if (session) { setUser(toUser(session)); setLogged(true); }
      } catch (e) {
        console.warn(e);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!logged) return;
    (async () => {
      try {
        const [d, m, b, s, r] = await Promise.all([listarDisciplinas(), listarMetas(), listarCronograma(), listarSimulados(), listarTodosRegistros()]);
        setDiscs(d); setMetas(m); setBlocks(b); setSims(s); setRecords(r);
      } catch (e) {
        console.warn(e);
      }
    })();
  }, [refresh, logged]);

  useEffect(() => { setSetting('tema', dark ? 'dark' : 'light').catch(() => {}); }, [dark]);

  // Mostra o tutorial de boas-vindas só na primeira vez que a pessoa entra com
  // uma conta. O "já viu" fica no banco, então não volta a cada login.
  useEffect(() => {
    if (!logged) return;
    (async () => {
      try {
        const visto = await getSetting('tutorial_visto');
        if (!visto) setTutorial(true);
      } catch {
        /* se falhar, apenas não mostra */
      }
    })();
  }, [logged]);

  const fecharTutorial = () => {
    setTutorial(false);
    setSetting('tutorial_visto', '1').catch(() => {});
  };

  // Reflete o cronograma real em lembretes no aparelho. Só roda quando o
  // usuário deixou os lembretes ligados; caso contrário, apaga o que houver.
  useEffect(() => {
    if (!logged) return;
    (async () => {
      try {
        const ligados = (await getSetting('notif_lembretes')) === '1';
        if (!ligados) {
          await cancelarTudo();
          return;
        }
        // O alerta de simulado só faz sentido para quem tem prova guardada e
        // está há mais de uma semana sem abrir a tela.
        let diasSemSimulado: number | null = null;
        if ((await getSetting('notif_simulado')) === '1' && sims.length > 0) {
          const ultimo = await getSetting('ultimo_simulado');
          const dias = ultimo ? Math.floor((Date.now() - new Date(ultimo).getTime()) / 86400000) : 999;
          diasSemSimulado = dias;
        }
        await agendarNotificacoes(
          blocks.map((b) => ({
            id: b.id,
            data: b.data,
            inicio: b.inicio,
            titulo: b.titulo,
            concluido: b.concluido,
          })),
          (await getSetting('notif_resumo')) === '1',
          diasSemSimulado
        );
      } catch (e) {
        console.warn(e);
      }
    })();
  }, [blocks, sims, logged]);

  const reload = () => setRefresh((x) => x + 1);
  const go = (a: Tela) => { setTela(a); setSelectedDisc(null); };
  const abrirSimulados = (de: Aba) => {
  setVoltarPara(de);
  // Registra a visita: é o que alimenta o alerta de "faz um simulado?".
  setSetting('ultimo_simulado', new Date().toISOString()).catch(() => {});
  go('simulados');
  reload();
};
  const sair = async () => {
    await logoutUsuario();
    timer.reset();
    setLogged(false);
    setTela('inicio');
    setUser(VAZIO);
  };

  if (booting) return <Splash />;
  if (!logged) return <Login onAuth={(u) => { setUser(toUser(u)); setLogged(true); setTela('inicio'); }} />;

  const navAtiva: Aba = tela === 'simulados' ? voltarPara : tela;

  return (
    <ImageBackground
      source={dark ? require('./assets/bg-app-dark.png') : require('./assets/bg-app.png')}
      resizeMode="cover"
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1 }}>
        {tela === 'inicio' && (
          <Inicio t={t} user={user} discs={discs} metas={metas} sims={sims} records={records}
            onAll={() => setAllSubjectsOpen(true)} onSubject={setSelectedDisc} onProgress={() => setProgressOpen(true)}
            onSimulados={() => abrirSimulados('inicio')} go={go} />
        )}
        {tela === 'cronograma' && <Cronograma t={t} discs={discs} blocks={blocks} reload={reload} />}
        {tela === 'registro' && <Registro t={t} discs={discs} metas={metas} records={records} timer={timer} reload={reload} />}
        {tela === 'metas' && <Metas t={t} metas={metas} reload={reload} />}
        {tela === 'simulados' && <Simulados t={t} discs={discs} sims={sims} reload={reload} onBack={() => go(voltarPara)} />}
        {tela === 'perfil' && <Perfil t={t} user={user} setUser={setUser} dark={dark} setDark={setDark} onLogout={sair} onSimulados={() => abrirSimulados('perfil')} onAbrirTutorial={() => setTutorial(true)} onDadosAlterados={reload} />}
      </View>
      <Nav t={t} aba={navAtiva} go={go} />

      <SubjectModal t={t} disc={selectedDisc} onClose={() => setSelectedDisc(null)} reload={reload} />
      <SubjectsModal t={t} visible={allSubjectsOpen} discs={discs} onClose={() => setAllSubjectsOpen(false)} onOpen={setSelectedDisc} reload={reload} />
      <ProgressModal t={t} visible={progressOpen} discs={discs} records={records} metas={metas} onClose={() => setProgressOpen(false)} onOpenSubject={setSelectedDisc} />

      <Tutorial t={t} visible={tutorial} onClose={fecharTutorial} />
    </ImageBackground>
  );
}
