import { describe, expect, it } from 'vitest';
import type { ReceivedNotification } from '../api/types';
import fixtures from './__fixtures__/notifications.json';
import { parseNotification } from './notifications';

const notifications = fixtures as ReceivedNotification[];

function fixture(receiptId: number) {
  const notification = notifications.find((n) => n.receiptId === receiptId);
  if (!notification) throw new Error(`Fixture ${receiptId} not found`);
  return notification.body;
}

describe('parseNotification', () => {
  it('parses a message sent via API (extendedTextMessage)', () => {
    expect(parseNotification(fixture(1))).toEqual({
      type: 'message',
      chatId: '10000002',
      id: '1790151580644',
      text: 'тест',
      direction: 'out',
      timestamp: 1790151580000,
      peerPhone: null,
      chatName: 'Получатель',
    });
  });

  it('parses a message sent from the phone (textMessage)', () => {
    expect(parseNotification(fixture(3))).toMatchObject({
      type: 'message',
      id: '117319376392047155',
      text: 'Проверка',
      direction: 'out',
      peerPhone: null,
    });
  });

  it('parses an incoming message with the peer phone as a string', () => {
    expect(parseNotification(fixture(10))).toMatchObject({
      type: 'message',
      chatId: '10000002',
      text: 'Как дела?',
      direction: 'in',
      peerPhone: '79000000002',
      chatName: 'Получатель',
    });
  });

  it('ignores reactions even though they carry text', () => {
    expect(parseNotification(fixture(5))).toBeNull();
  });

  it('parses delivery statuses', () => {
    expect(parseNotification(fixture(2))).toEqual({
      type: 'status',
      chatId: '10000002',
      id: '1790151580644',
      status: 'delivered',
    });
    expect(parseNotification(fixture(6))).toMatchObject({ status: 'read' });
  });

  it('maps failed statuses to error', () => {
    expect(
      parseNotification({
        typeWebhook: 'outgoingMessageStatus',
        chatId: '1',
        idMessage: '2',
        status: 'noAccount',
      }),
    ).toMatchObject({ status: 'error', error: 'У получателя нет аккаунта MAX' });
  });

  it('ignores unknown and malformed notifications', () => {
    expect(parseNotification({ typeWebhook: 'stateInstanceChanged' })).toBeNull();
    expect(parseNotification({ typeWebhook: 'constructor' })).toBeNull();
    expect(parseNotification({ typeWebhook: 'incomingMessageReceived' })).toBeNull();
    expect(
      parseNotification({ typeWebhook: 'outgoingMessageStatus', chatId: '1', idMessage: '2' }),
    ).toBeNull();
  });

  it('ignores group chats', () => {
    const body = structuredClone(fixture(10));
    (body.senderData as Record<string, unknown>).chatType = 'group';
    expect(parseNotification(body)).toBeNull();
  });
});
