import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

// Cronômetro do "Foco Ativo". Fica no App para não zerar ao trocar de aba.
//
// O tempo NÃO é contado somando 1 a cada tique do intervalo: quando o app vai
// para segundo plano, o Android freia (ou para) o JavaScript, e um contador
// desse tipo ficaria para trás, gravando menos tempo do que o realmente
// estudado. Aqui guardamos o instante de início de cada trecho e calculamos a
// diferença, então o valor continua correto mesmo com o app pausado.
export function useTimer() {
  const [sec, setSec] = useState(0);
  const [run, setRunState] = useState(false);
  const [disc, setDisc] = useState('');

  const acumulado = useRef(0);  // ms dos trechos já pausados
  const inicio = useRef(0);     // início do trecho que está rodando
  const rodando = useRef(false);

  const calcular = () => Math.floor((acumulado.current + (rodando.current ? Date.now() - inicio.current : 0)) / 1000);

  useEffect(() => {
    if (!run) return;
    // Serve só para redesenhar a tela; o valor é sempre recalculado do relógio.
    const t = setInterval(() => setSec(calcular()), 250);
    return () => clearInterval(t);
  }, [run]);

  // Ao voltar do segundo plano, o intervalo pode ter ficado parado por um
  // tempo. Recalculamos na hora para o cronômetro não parecer travado.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active' && rodando.current) setSec(calcular());
    });
    return () => sub.remove();
  }, []);

  const setRun = useCallback((v: boolean) => {
    if (v === rodando.current) return;
    if (v) {
      inicio.current = Date.now();
      rodando.current = true;
    } else {
      acumulado.current += Date.now() - inicio.current;
      rodando.current = false;
      setSec(Math.floor(acumulado.current / 1000));
    }
    setRunState(v);
  }, []);

  const reset = useCallback(() => {
    acumulado.current = 0;
    inicio.current = 0;
    rodando.current = false;
    setSec(0);
    setRunState(false);
  }, []);

  return { sec, run, setRun, reset, disc, setDisc };
}
