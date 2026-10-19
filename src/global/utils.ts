export type Disciplina = { id: string; nome: string; area: string; nota: number };
export type Usuario = { id: string; nome: string; email: string; nivel: string; idade: string; sexo: string; avatar?: string | null };
export type Aba = 'inicio' | 'cronograma' | 'registro' | 'metas' | 'perfil';
export type Tela = Aba | 'simulados';

export const NIVEIS = ['Ensino Fundamental', 'Ensino Médio — 1º Ano', 'Ensino Médio — 2º Ano', 'Ensino Médio — 3º Ano', 'Ensino Superior'];
export const AREAS = ['Exatas', 'Humanas', 'Linguagens', 'Biológicas', 'Outras'];
export const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']; // indexado por Date.getDay()

export const pad = (n: number) => String(n).padStart(2, '0');
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fmtDur = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h ? `${h}h ${pad(m)}min` : `${m}min`;
};
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
export const clock = (sec: number) => `${pad(Math.floor(sec / 3600))}:${pad(Math.floor(sec / 60) % 60)}:${pad(sec % 60)}`;

const toMin = (s: string) => {
  const [h, m] = s.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
export const durBloco = (ini: string, fim: string) => {
  const d = toMin(fim) - toMin(ini);
  return d > 0 ? fmtDur(d * 60) : '';
};

// Semana (segunda a domingo) que contém a data.
export const semanaDe = (date: Date) => {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  base.setDate(base.getDate() - ((base.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d;
  });
};
