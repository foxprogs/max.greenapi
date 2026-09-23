import { describe, expect, it } from 'vitest';
import { historyResponse } from './__fixtures__/history';
import { parseHistory } from './history';

describe('parseHistory', () => {
  it('keeps text messages only, oldest first, with statuses', () => {
    const history = parseHistory(historyResponse);

    expect(history.name).toBe('Получатель');
    expect(
      history.messages.map(({ text, direction, status }) => [text, direction, status]),
    ).toEqual([
      ['Привет! Это было вчера', 'in', 'read'],
      ['тест', 'out', 'read'],
      ['Чек', 'out', 'delivered'],
      ['Как дела?', 'in', 'read'],
    ]);
    expect(history.messages[0]?.timestamp).toBe(1790064000 * 1000);
  });

  it('prefers the contact name and falls back to "sent" for unknown statuses', () => {
    const history = parseHistory([
      { ...historyResponse[0], senderContactName: 'Иван из контактов' },
      { ...historyResponse[1], statusMessage: 'constructor' },
    ]);

    expect(history.name).toBe('Иван из контактов');
    expect(history.messages.find((m) => m.direction === 'out')?.status).toBe('sent');
  });

  it('survives malformed responses', () => {
    expect(parseHistory(null)).toEqual({ name: null, messages: [] });
    expect(parseHistory({ error: 'oops' }).messages).toEqual([]);
    expect(
      parseHistory([null, 1, { type: 'incoming' }, { ...historyResponse[0], chatType: 'group' }])
        .messages,
    ).toEqual([]);
  });
});
