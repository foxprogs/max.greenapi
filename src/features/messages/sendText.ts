import { ApiError } from '../../api/client';
import { sendMessage } from '../../api/greenApi';
import type { Credentials } from '../../api/types';
import { useChatsStore } from '../../store/chats';

export const MAX_MESSAGE_LENGTH = 4000;

async function deliver(credentials: Credentials, chatId: string, messageId: string, text: string) {
  const store = useChatsStore.getState();
  try {
    const { idMessage } = await sendMessage(credentials, { chatId, message: text });
    store.markMessageSent(chatId, messageId, idMessage);
  } catch (error) {
    const reason = error instanceof ApiError ? error.message : 'Не удалось отправить сообщение';
    store.markMessageFailed(chatId, messageId, reason);
  }
}

/** Оптимистичная отправка: сообщение сразу появляется в ленте со статусом pending. */
export function sendText(credentials: Credentials, chatId: string, text: string) {
  const id = `local-${crypto.randomUUID()}`;
  useChatsStore.getState().addPendingMessage(chatId, { id, text, timestamp: Date.now() });
  return deliver(credentials, chatId, id, text);
}

export function retryMessage(credentials: Credentials, chatId: string, messageId: string) {
  const store = useChatsStore.getState();
  const message = store.messages[chatId]?.find((m) => m.id === messageId);
  if (message?.status !== 'error') return;
  store.markMessagePending(chatId, messageId);
  return deliver(credentials, chatId, messageId, message.text);
}
