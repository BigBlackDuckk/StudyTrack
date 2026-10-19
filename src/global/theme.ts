import { Platform, StatusBar } from 'react-native';

// Paleta extraída do molde (mockup) do StudyTrack.
export type Theme = {
  bg: string;        // fundo lilás das telas
  card: string;      // cards roxos (estatísticas, disciplinas)
  surface: string;   // cards brancos
  text: string;      // texto sobre cards brancos
  muted: string;     // texto secundário
  accent: string;    // índigo (chips ativos, switches)
  primary: string;   // roxo forte (anel, botão Encerrar)
  nav: string;       // barra de navegação
  navActive: string; // item ativo da barra
  line: string;      // divisórias
  good: string;
  warn: string;
  bar: string;       // barras amarelas do gráfico
  chartBg: string;   // fundo do gráfico
  title: string;     // títulos sobre o fundo lilás
  sub: string;       // subtítulos sobre o fundo lilás
  label: string;     // rótulos de seção (NOTIFICAÇÕES...)
  input: string;     // fundo de inputs em modais
};

export const LIGHT: Theme = {
  bg: '#C18AED',
  card: '#A162DD',
  surface: '#FFFFFF',
  text: '#1B1035',
  muted: '#7B7395',
  accent: '#4F46E5',
  primary: '#7C37BE',
  nav: '#5E1F8A',
  navActive: '#E874FF',
  line: '#EDE7F6',
  good: '#10B981',
  warn: '#F59E0B',
  bar: '#EBD741',
  chartBg: '#F8EEFF',
  title: '#FFFFFF',
  sub: '#1B1035',
  label: '#7B7395',
  input: '#F6F1FB',
};

export const DARK: Theme = {
  bg: '#241236',
  card: '#3A1A5C',
  surface: '#2E1A48',
  text: '#FFFFFF',
  muted: '#B9A8CF',
  accent: '#8B84FF',
  primary: '#9B5DE0',
  nav: '#170A28',
  navActive: '#E874FF',
  line: '#43285F',
  good: '#34D399',
  warn: '#FBBF24',
  bar: '#EBD741',
  chartBg: '#2E1A48',
  title: '#FFFFFF',
  sub: '#D9C6EA',
  label: '#B9A8CF',
  input: '#3A2358',
};

const AREA: Record<string, string> = {
  Exatas: '#4F46E5',
  Humanas: '#F59E0B',
  Linguagens: '#10B981',
  Biológicas: '#EC4899',
  Outras: '#8B5CF6',
};
export const areaColor = (area?: string | null) => AREA[area || ''] || '#8B5CF6';

// Espaço do topo (barra de status) nas telas.
export const TOP = Platform.OS === 'ios' ? 62 : (StatusBar.currentHeight || 24) + 20;

export const shadow = {
  shadowColor: '#2A0A4A',
  shadowOpacity: 0.22,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 5 },
  elevation: 5,
} as const;
