import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatEvent, MessageEvent, StatusEvent } from '../lib/notifications';
import type { Chat, Message, MessageStatus } from '../types';

export type ChatsData = {
  chats: Record<string, Chat>;
  messages: Record<string, Message[]>;
  activeChatId: string | null;
};

export const initialChatsData: ChatsData = {
  chats: {},
  messages: {},
  activeChatId: null,
};

const STATUS_RANK: Record<MessageStatus, number> = {
  error: 0,
  pending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
};

function canUpdateStatus(current: MessageStatus, next: MessageStatus): boolean {
  // Статусы приходят в любом порядке: не понижаем, а ошибка допустима только до доставки.
  if (next === 'error') return STATUS_RANK[current] < STATUS_RANK.delivered;
  return STATUS_RANK[next] > STATUS_RANK[current];
}

function newChat(id: string): Chat {
  return { id, phone: null, name: null, unread: 0, updatedAt: 0 };
}

function updateMessages(
  data: ChatsData,
  chatId: string,
  update: (messages: Message[]) => Message[],
): ChatsData {
  return { ...data, messages: { ...data.messages, [chatId]: update(data.messages[chatId] ?? []) } };
}

function updateMessage(
  data: ChatsData,
  chatId: string,
  messageId: string,
  patch: Partial<Message>,
): ChatsData {
  return updateMessages(data, chatId, (messages) =>
    messages.map((message) => (message.id === messageId ? { ...message, ...patch } : message)),
  );
}

function applyMessage(data: ChatsData, event: MessageEvent): ChatsData {
  const { chatId } = event;
  if (data.messages[chatId]?.some((message) => message.id === event.id)) return data;

  const chat = data.chats[chatId] ?? newChat(chatId);
  const isUnread = event.direction === 'in' && data.activeChatId !== chatId;
  const next: ChatsData = {
    ...data,
    chats: {
      ...data.chats,
      [chatId]: {
        ...chat,
        phone: chat.phone ?? event.peerPhone,
        name: chat.name ?? event.chatName,
        unread: chat.unread + (isUnread ? 1 : 0),
        updatedAt: Math.max(chat.updatedAt, event.timestamp),
      },
    },
  };

  // Если уведомление обогнало ответ sendMessage, локальную копию уберёт markMessageSent.
  return updateMessages(next, chatId, (messages) => [
    ...messages,
    {
      id: event.id,
      text: event.text,
      direction: event.direction,
      timestamp: event.timestamp,
      status: event.direction === 'in' ? 'read' : 'sent',
    },
  ]);
}

function applyStatus(data: ChatsData, event: StatusEvent): ChatsData {
  // Статус сообщения, которого нет в сторе (например, отправленного до входа), не нужен.
  const message = data.messages[event.chatId]?.find((m) => m.id === event.id);
  if (!message || !canUpdateStatus(message.status, event.status)) return data;
  return updateMessage(data, event.chatId, event.id, { status: event.status, error: undefined });
}

export function applyEvent(data: ChatsData, event: ChatEvent): ChatsData {
  return event.type === 'message' ? applyMessage(data, event) : applyStatus(data, event);
}

/** Открывает чат с пользователем, чей chatId получен из checkAccount по номеру. */
export function openChat(data: ChatsData, chatId: string, phone: string): ChatsData {
  const chat = data.chats[chatId] ?? { ...newChat(chatId), updatedAt: Date.now() };
  return selectChat(
    { ...data, chats: { ...data.chats, [chatId]: { ...chat, phone: chat.phone ?? phone } } },
    chatId,
  );
}

export function selectChat(data: ChatsData, chatId: string | null): ChatsData {
  const chat = chatId ? data.chats[chatId] : undefined;
  if (!chat) return { ...data, activeChatId: null };
  return {
    ...data,
    activeChatId: chat.id,
    chats: chat.unread ? { ...data.chats, [chat.id]: { ...chat, unread: 0 } } : data.chats,
  };
}

export function addPendingMessage(
  data: ChatsData,
  chatId: string,
  message: Pick<Message, 'id' | 'text' | 'timestamp'>,
): ChatsData {
  const chat = data.chats[chatId];
  if (!chat) return data;
  const next = updateMessages(data, chatId, (messages) => [
    ...messages,
    { ...message, direction: 'out', status: 'pending' },
  ]);
  return {
    ...next,
    chats: { ...next.chats, [chatId]: { ...chat, updatedAt: message.timestamp } },
  };
}

export function markMessageSent(
  data: ChatsData,
  chatId: string,
  localId: string,
  idMessage: string,
): ChatsData {
  const messages = data.messages[chatId] ?? [];
  if (!messages.some((m) => m.id === localId)) return data;
  // Уведомление об этом сообщении уже пришло и создало копию с настоящим id.
  if (messages.some((m) => m.id === idMessage)) {
    return updateMessages(data, chatId, (list) => list.filter((m) => m.id !== localId));
  }
  return updateMessage(data, chatId, localId, { id: idMessage, status: 'sent', error: undefined });
}

export function markMessageFailed(
  data: ChatsData,
  chatId: string,
  messageId: string,
  error: string,
): ChatsData {
  return updateMessage(data, chatId, messageId, { status: 'error', error });
}

export function markMessagePending(data: ChatsData, chatId: string, messageId: string) {
  return updateMessage(data, chatId, messageId, { status: 'pending', error: undefined });
}

type ChatsActions = {
  applyEvent: (event: ChatEvent) => void;
  openChat: (chatId: string, phone: string) => void;
  selectChat: (chatId: string | null) => void;
  addPendingMessage: (chatId: string, message: Pick<Message, 'id' | 'text' | 'timestamp'>) => void;
  markMessageSent: (chatId: string, localId: string, idMessage: string) => void;
  markMessageFailed: (chatId: string, messageId: string, error: string) => void;
  markMessagePending: (chatId: string, messageId: string) => void;
  reset: () => void;
};

export type ChatsState = ChatsData & ChatsActions;

export const useChatsStore = create<ChatsState>()(
  persist(
    (set) => ({
      ...initialChatsData,
      applyEvent: (event) => set((state) => applyEvent(state, event)),
      openChat: (chatId, phone) => set((state) => openChat(state, chatId, phone)),
      selectChat: (chatId) => set((state) => selectChat(state, chatId)),
      addPendingMessage: (chatId, message) =>
        set((state) => addPendingMessage(state, chatId, message)),
      markMessageSent: (chatId, localId, idMessage) =>
        set((state) => markMessageSent(state, chatId, localId, idMessage)),
      markMessageFailed: (chatId, messageId, error) =>
        set((state) => markMessageFailed(state, chatId, messageId, error)),
      markMessagePending: (chatId, messageId) =>
        set((state) => markMessagePending(state, chatId, messageId)),
      reset: () => set(initialChatsData),
    }),
    {
      name: 'max-chat/chats',
      partialize: ({ chats, messages, activeChatId }): ChatsData => ({
        chats,
        messages,
        activeChatId,
      }),
      // Отправка, прерванная перезагрузкой страницы, уже не завершится — даём повторить.
      merge: (persisted, current) => {
        // При первом запуске в хранилище пусто и persisted === undefined.
        const data = (persisted ?? {}) as Partial<ChatsData>;
        const messages = Object.fromEntries(
          Object.entries(data.messages ?? {}).map(([chatId, list]) => [
            chatId,
            list.map((m) =>
              m.status === 'pending'
                ? { ...m, status: 'error' as const, error: 'Не отправлено' }
                : m,
            ),
          ]),
        );
        return { ...current, ...data, messages };
      },
    },
  ),
);
