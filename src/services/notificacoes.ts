// Serviço de notificações locais do StudyTrack.
//
// Todas as notificações são LOCAIS: são agendadas no próprio aparelho a
// partir do que o usuário já registrou (cronograma e metas). Nada é enviado
// para servidor, então o app continua funcionando totalmente offline.
//
// No Android, notificações locais funcionam normalmente no Expo Go.
// Notificações push (remotas) exigiriam development build — não são usadas aqui.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Precisa ser definido no escopo do módulo, antes de agendar qualquer
// notificação. Sem handler, o comportamento padrão é NÃO mostrar nada.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const CANAL = 'estudos';

// No Android a permissão só é exibida depois que existe um canal criado.
async function garantirCanal() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CANAL, {
    name: 'Lembretes de estudo',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#B98BE8',
  });
}

/** Converte "HH:MM" em minutos desde a meia-noite. */
const emMinutos = (hhmm: string) => {
  const [h, m] = (hhmm || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/**
 * Converte um dia "AAAA-MM-DD" + "HH:MM" em Date local.
 * Retorna null se o horário já passou hoje.
 */
export function quandoDispara(data: string, hora: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;
  const [ano, mes, dia] = data.split('-').map(Number);
  const minutos = emMinutos(hora);
  const alvo = new Date(ano, mes - 1, dia, Math.floor(minutos / 60), minutos % 60, 0, 0);
  // Margem de 1 minuto para não perder um bloco que está começando agora.
  if (alvo.getTime() <= Date.now() + 60_000) return null;
  return alvo;
}

export async function garantirPermissao(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') return false;
    await garantirCanal();
    const atual = await Notifications.getPermissionsAsync();
    if (atual.granted) return true;
    const pedido = await Notifications.requestPermissionsAsync();
    return !!pedido.granted;
  } catch {
    return false;
  }
}

/** Remove todas as notificações agendadas (usado quando o usuário desliga). */
export async function cancelarTudo() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    /* nada a fazer */
  }
}

/** Agenda os lembretes a partir do que já está salvo no app. */
export async function agendar(
  blocos: { id: string; data: string; inicio: string; titulo: string; concluido: number }[],
  resumoDiario: boolean
) {
  try {
    if (Platform.OS === 'web') return 0;
    await garantirCanal();
    await cancelarTudo();

    let total = 0;

    for (const b of blocos) {
      if (b.concluido) continue;
      const quando = quandoDispara(b.data, b.inicio);
      if (!quando) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Hora de estudar',
          body: b.titulo,
          data: { blocoId: b.id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: quando },
      });
      total++;
    }

    if (resumoDiario) {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      amanha.setHours(19, 0, 0, 0);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Seu dia de estudos',
          body: 'Bora revisar o que você estudou hoje?',
          data: { resumo: true },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: amanha },
      });
      total++;
    }

    return total;
  } catch {
    // Sem permissão, ou sem canal: o app segue funcionando normalmente.
    return 0;
  }
}