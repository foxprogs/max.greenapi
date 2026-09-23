import { describe, expect, it } from 'vitest';
import type { ReceivedNotification } from '../api/types';
import fixtures from '../lib/__fixtures__/notifications.json';
import { type ChatEvent, parseNotification } from '../lib/notifications';
import {
  addPendingMessage,
  applyEvent,
  type ChatsData,
  initialChatsData,
  markMessageSent,
  openChat,
  selectChat,
} from './chats';

const PEER_PHONE = '79000000002';
/** chatId, который checkAccount возвращает для PEER_PHONE. */
const CHAT_ID = '10000002';
/** Время отправки «тест» по часам браузера — совпадает с серверным из фикстур. */
const SENT_AT = 1790151580 * 1000;

const events = (fixtures as ReceivedNotification[])
  .map((n) => parseNotification(n.body))
  .filter((e): e is ChatEvent => e !== null);

function replay(data: ChatsData, list: ChatEvent[] = events): ChatsData {
  return list.reduce(applyEvent, data);
}

function withPending(timestamp = SENT_AT): ChatsData {
  const data = openChat(initialChatsData, CHAT_ID, PEER_PHONE);
  return addPendingMessage(data, CHAT_ID, { id: 'local-1', text: 'тест', timestamp });
}

/** Чат открыт по номеру, «тест» отправлен через API и получил idMessage. */
function sentFromUi(): ChatsData {
  return markMessageSent(withPending(), CHAT_ID, 'local-1', '1790151580644');
}

describe('chats store', () => {
  it('collects notifications into the chat opened by phone', () => {
    const data = replay(sentFromUi());

    expect(Object.keys(data.chats)).toEqual([CHAT_ID]);
    expect(data.chats[CHAT_ID]).toMatchObject({ phone: PEER_PHONE, name: 'Получатель' });
    expect(
      data.messages[CHAT_ID]?.map(({ text, direction, status }) => [text, direction, status]),
    ).toEqual([
      ['тест', 'out', 'read'],
      ['Проверка', 'out', 'read'],
      ['Чек', 'out', 'delivered'],
      ['Как дела?', 'in', 'read'],
    ]);
  });

  it('is idempotent when notifications are delivered twice', () => {
    const once = replay(sentFromUi());
    expect(replay(once)).toEqual(once);
  });

  it('creates a chat for an unknown sender and counts unread messages', () => {
    const data = replay(initialChatsData);

    expect(Object.keys(data.chats)).toEqual([CHAT_ID]);
    expect(data.chats[CHAT_ID]).toMatchObject({ phone: PEER_PHONE, unread: 1 });
    expect(selectChat(data, CHAT_ID).chats[CHAT_ID]?.unread).toBe(0);
  });

  it('does not count unread messages in the active chat', () => {
    const data = replay(sentFromUi());
    expect(data.chats[CHAT_ID]?.unread).toBe(0);
  });

  it('opens an existing chat instead of creating a duplicate', () => {
    const data = openChat(selectChat(replay(initialChatsData), null), CHAT_ID, PEER_PHONE);

    expect(Object.keys(data.chats)).toEqual([CHAT_ID]);
    expect(data.activeChatId).toBe(CHAT_ID);
    expect(data.messages[CHAT_ID]).toHaveLength(4);
  });

  it('never downgrades a status', () => {
    const [sent, delivered, , , , read] = events;
    if (!sent || !delivered || !read) throw new Error('Unexpected fixtures');

    const data = replay(sentFromUi(), [sent, read, delivered]);
    expect(data.messages[CHAT_ID]?.[0]?.status).toBe('read');
  });

  it('drops the local copy when the notification outruns the sendMessage response', () => {
    let data = replay(withPending(1), events.slice(0, 1));
    data = markMessageSent(data, CHAT_ID, 'local-1', '1790151580644');

    expect(data.messages[CHAT_ID]).toEqual([
      expect.objectContaining({ id: '1790151580644', status: 'sent' }),
    ]);
  });
});
