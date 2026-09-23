import type { HistoryMessage } from '../api/types';
import type { Message, MessageStatus } from '../types';
import { asString, isRecord, lookup } from './guards';

export type ChatHistory = {
  /** Имя собеседника из входящих: из контактов, иначе из профиля. */
  name: string | null;
  /** От старых к новым. */
  messages: Message[];
};

const STATUSES: Record<string, MessageStatus> = {
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
};

/** Как и в уведомлениях, берём только текстовые типы: у реакций тоже есть текст. */
function extractText(item: Partial<HistoryMessage>): string | null {
  if (item.typeMessage === 'textMessage') return asString(item.textMessage);
  if (item.typeMessage === 'extendedTextMessage') {
    return asString(item.extendedTextMessage?.text) ?? asString(item.textMessage);
  }
  return null;
}

function parseItem(value: unknown): { message: Message; item: Partial<HistoryMessage> } | null {
  if (!isRecord(value)) return null;
  const item = value as Partial<HistoryMessage>;
  const id = asString(item.idMessage);
  const text = extractText(item);
  if (!id || text === null || typeof item.timestamp !== 'number' || item.isDeleted) return null;
  if (item.chatType !== undefined && item.chatType !== 'user') return null;
  if (item.type !== 'incoming' && item.type !== 'outgoing') return null;

  const direction = item.type === 'incoming' ? 'in' : 'out';
  const status = direction === 'in' ? 'read' : (lookup(STATUSES, item.statusMessage) ?? 'sent');
  return { message: { id, text, direction, timestamp: item.timestamp * 1000, status }, item };
}

/** Разбирает ответ getChatHistory: всё нетекстовое и непонятное отбрасывается. */
export function parseHistory(response: unknown): ChatHistory {
  const parsed = (Array.isArray(response) ? response : [])
    .map(parseItem)
    .filter((entry) => entry !== null);

  const incoming = parsed.find(({ message }) => message.direction === 'in')?.item;
  return {
    name: asString(incoming?.senderContactName) ?? asString(incoming?.senderName),
    messages: parsed.map(({ message }) => message).sort((a, b) => a.timestamp - b.timestamp),
  };
}
