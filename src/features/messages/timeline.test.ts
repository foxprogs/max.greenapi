import { describe, expect, it } from 'vitest';
import type { Message } from '../../types';
import { buildTimeline } from './timeline';

const NOW = new Date(2026, 8, 23, 15, 0).getTime();
const at = (day: number, hours: number, minutes = 0) =>
  new Date(2026, 8, day, hours, minutes).getTime();

let seq = 0;
const msg = (timestamp: number, direction: Message['direction'] = 'in'): Message => ({
  id: `m${++seq}`,
  text: 'текст',
  direction,
  timestamp,
  status: 'read',
});

const shape = (messages: Message[]) =>
  buildTimeline(messages, NOW).map((item) =>
    item.type === 'day'
      ? item.label
      : `${item.message.direction}${item.stackedAbove ? '^' : ''}${item.stackedBelow ? 'v' : ''}`,
  );

describe('buildTimeline', () => {
  it('пустой чат — пустая лента', () => {
    expect(buildTimeline([], NOW)).toEqual([]);
  });

  it('разделитель перед первым сообщением каждого дня', () => {
    expect(shape([msg(at(22, 23, 52)), msg(at(22, 23, 55)), msg(at(23, 0, 1))])).toEqual([
      'Вчера',
      'inv',
      'in^',
      'Сегодня',
      'in',
    ]);
  });

  it('склеивает подряд идущие сообщения одного направления', () => {
    expect(
      shape([
        msg(at(23, 10, 0)),
        msg(at(23, 10, 1)),
        msg(at(23, 10, 2), 'out'),
        msg(at(23, 10, 3), 'out'),
      ]),
    ).toEqual(['Сегодня', 'inv', 'in^', 'outv', 'out^']);
  });

  it('не склеивает сообщения с большой паузой', () => {
    expect(shape([msg(at(23, 10, 0)), msg(at(23, 10, 10))])).toEqual(['Сегодня', 'in', 'in']);
  });
});
