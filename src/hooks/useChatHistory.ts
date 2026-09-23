import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { getChatHistory } from '../api/greenApi';
import type { Credentials } from '../api/types';
import { delay } from '../lib/delay';
import { parseHistory } from '../lib/history';
import { useChatsStore } from '../store/chats';

export type HistoryStatus = 'loading' | 'loaded' | 'error';

const HISTORY_COUNT = 50;
/** getChatHistory ограничен одним запросом в секунду на инстанс — на 429 ждём с запасом. */
const RATE_LIMIT_DELAY_MS = 1100;
const RATE_LIMIT_RETRIES = 2;

/** Историю каждого чата грузим один раз за сессию: дальше новые сообщения приходят уведомлениями. */
const loadedChats = new Set<string>();

export function resetHistoryCache() {
  loadedChats.clear();
}

async function loadHistory(credentials: Credentials, chatId: string, signal: AbortSignal) {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await getChatHistory(credentials, { chatId, count: HISTORY_COUNT }, signal);
      useChatsStore.getState().mergeHistory(chatId, parseHistory(response));
      return;
    } catch (error) {
      // При быстром переключении чатов запросы могут упереться в лимит — повторяем.
      const isRateLimited = error instanceof ApiError && error.status === 429;
      if (!isRateLimited || attempt >= RATE_LIMIT_RETRIES) throw error;
      await delay(RATE_LIMIT_DELAY_MS, signal);
    }
  }
}

/** Подгружает историю чата при открытии; повтор — через `retry`. */
export function useChatHistory(credentials: Credentials, chatId: string) {
  const key = `${credentials.idInstance}:${chatId}`;
  const [status, setStatus] = useState<HistoryStatus>(() =>
    loadedChats.has(key) ? 'loaded' : 'loading',
  );
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt перезапускает загрузку
  useEffect(() => {
    if (loadedChats.has(key)) return;
    const controller = new AbortController();
    setStatus('loading');
    loadHistory(credentials, chatId, controller.signal).then(
      () => {
        loadedChats.add(key);
        setStatus('loaded');
      },
      (reason: unknown) => {
        if (controller.signal.aborted) return;
        console.warn('Failed to load chat history', reason);
        setError(reason instanceof ApiError ? reason.message : 'Не удалось загрузить историю');
        setStatus('error');
      },
    );
    return () => controller.abort();
  }, [credentials, chatId, key, attempt]);

  return { status, error, retry: () => setAttempt((value) => value + 1) };
}
