import { useEffect, useState } from 'react';

// Cronômetro do "Foco Ativo". Fica no App para não zerar ao trocar de aba.
export function useTimer() {
  const [sec, setSec] = useState(0);
  const [run, setRun] = useState(false);
  const [disc, setDisc] = useState('');
  useEffect(() => {
    if (!run) return;
    const i = setInterval(() => setSec((x) => x + 1), 1000);
    return () => clearInterval(i);
  }, [run]);
  const reset = () => {
    setSec(0);
    setRun(false);
  };
  return { sec, run, setRun, reset, disc, setDisc };
}
