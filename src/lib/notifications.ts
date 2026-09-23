import type { MessageWebhook, OutgoingMessageStatus, WebhookBody } from '../api/types';
import type { MessageStatus } from '../types';

export type MessageEvent = {
  type: 'message';
  /** chatId из уведомления — в MAX это внутренний id, а не `номер@c.us`. */
  chatId: string;
  id: string;
  text: string;
  /** in — от собеседника, out — наше: отправлено с телефона или через API. */
  direction: 'in' | 'out';
  timestamp: number;
  /** Номер собеседника; известен только во входящих. */
  peerPhone: string | null;
  chatName: string | null;
};

export type StatusEvent = {
  type: 'status';
  chatId: string;
  id: string;
  status: MessageStatus;
};

export type ChatEvent = MessageEvent | StatusEvent;

const DIRECTIONS: Record<MessageWebhook['typeWebhook'], MessageEvent['direction']> = {
  incomingMessageReceived: 'in',
  outgoingMessageReceived: 'out',
  outgoingAPIMessageReceived: 'out',
};

const STATUSES: Record<OutgoingMessageStatus, MessageStatus> = {
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  failed: 'error',
  noAccount: 'error',
};

/** Безопасный доступ к таблице по ключу извне: без обращения к прототипу (`constructor` и т.п.). */
function lookup<T>(table: Record<string, T>, key: unknown): T | undefined {
  return typeof key === 'string' && Object.hasOwn(table, key) ? table[key] : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

/**
 * Текст берём только у текстовых типов: реакции тоже приходят как входящие
 * с текстом-эмодзи в extendedTextMessageData, но typeMessage у них reactionMessage.
 */
function extractText(messageData: unknown): string | null {
  if (!isRecord(messageData)) return null;
  const { typeMessage, textMessageData, extendedTextMessageData } = messageData;
  if (typeMessage === 'textMessage' && isRecord(textMessageData)) {
    return asString(textMessageData.textMessage);
  }
  if (typeMessage === 'extendedTextMessage' && isRecord(extendedTextMessageData)) {
    return asString(extendedTextMessageData.text);
  }
  return null;
}

function parseMessage(
  body: WebhookBody,
  direction: MessageEvent['direction'],
): MessageEvent | null {
  const { senderData, idMessage, timestamp } = body;
  if (!isRecord(senderData)) return null;

  const chatId = asString(senderData.chatId);
  const id = asString(idMessage);
  const text = extractText(body.messageData);
  if (!chatId || !id || text === null || typeof timestamp !== 'number') return null;
  // Группы и каналы вне рамок задания.
  if (senderData.chatType !== undefined && senderData.chatType !== 'user') return null;

  const phone = senderData.senderPhoneNumber;
  return {
    type: 'message',
    chatId,
    id,
    text,
    direction,
    timestamp: timestamp * 1000,
    // В исходящих senderPhoneNumber — наш собственный номер, он не нужен.
    peerPhone:
      direction === 'in' && (typeof phone === 'number' || typeof phone === 'string')
        ? String(phone)
        : null,
    chatName: asString(senderData.chatName),
  };
}

function parseStatus(body: WebhookBody): StatusEvent | null {
  const chatId = asString(body.chatId);
  const id = asString(body.idMessage);
  const status = lookup(STATUSES, body.status);
  if (!chatId || !id || !status) return null;
  return { type: 'status', chatId, id, status };
}

/** Превращает тело уведомления в событие чата; всё, что не нужно интерфейсу, — null. */
export function parseNotification(body: WebhookBody): ChatEvent | null {
  if (body.typeWebhook === 'outgoingMessageStatus') return parseStatus(body);
  const direction = lookup(DIRECTIONS, body.typeWebhook);
  return direction ? parseMessage(body, direction) : null;
}
