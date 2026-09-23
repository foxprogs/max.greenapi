import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { deleteNotification, receiveNotification } from '../api/greenApi';
import type { Credentials, WebhookBody } from '../api/types';
import { delay } from '../lib/delay';
import { parseNotification } from '../lib/notifications';
import { useChatsStore } from '../store/chats';

export type PollingStatus = 'connecting' | 'online' | 'offline' | 'unauthorized';

const RECEIVE_TIMEOUT_SECONDS = 20;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;

/** Пауза перед повтором; если сеть вернулась раньше — повторяем сразу. */
function waitBeforeRetry(ms: number, signal: AbortSignal) {
  const wake = new AbortController();
  const onWake = () => wake.abort();
  window.addEventListener('online', onWake, { once: true });
  signal.addEventListener('abort', onWake, { once: true });
  return delay(ms, wake.signal).finally(() => {
    window.removeEventListener('online', onWake);
    signal.removeEventListener('abort', onWake);
  });
}

/** Креды отозваны или инстанс заблокирован: повторять бессмысленно. */
function isFatal(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function handleNotification(body: WebhookBody) {
  try {
    const event = parseNotification(body);
    if (event) useChatsStore.getState().applyEvent(event);
  } catch (error) {
    // Одно битое уведомление не должно останавливать очередь.
    console.error('Failed to handle notification', body, error);
  }
}

async function pollNotifications(
  credentials: Credentials,
  signal: AbortSignal,
  onStatus: (status: PollingStatus) => void,
) {
  let backoff = INITIAL_BACKOFF_MS;
  while (!signal.aborted) {
    try {
      const notification = await receiveNotification(credentials, RECEIVE_TIMEOUT_SECONDS, signal);
      onStatus('online');
      backoff = INITIAL_BACKOFF_MS;
      if (!notification) continue;

      handleNotification(notification.body);
      // Удаляем всегда, даже необработанные: иначе очередь встанет на этом уведомлении.
      await deleteNotification(credentials, notification.receiptId, signal);
    } catch (error) {
      if (signal.aborted) return;
      if (isFatal(error)) {
        onStatus('unauthorized');
        return;
      }
      console.warn('Notification polling failed, retrying in', backoff, 'ms', error);
      onStatus('offline');
      await waitBeforeRetry(backoff, signal);
      backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
    }
  }
}

/** Один цикл long polling на сессию; останавливается при размонтировании и смене кредов. */
export function useNotificationPolling(credentials: Credentials): PollingStatus {
  const [status, setStatus] = useState<PollingStatus>('connecting');

  useEffect(() => {
    const controller = new AbortController();
    setStatus('connecting');
    void pollNotifications(credentials, controller.signal, setStatus);
    return () => controller.abort();
  }, [credentials]);

  return status;
}
