import { formatDayLabel, isSameDay } from '../../lib/format';
import type { Message } from '../../types';

/** Сообщения одного направления с паузой меньше этой склеиваются в стопку. */
const STACK_GAP_MS = 5 * 60 * 1000;

export type TimelineItem =
  | { type: 'day'; key: string; label: string }
  | {
      type: 'message';
      key: string;
      message: Message;
      /** Есть сообщение сверху в той же стопке — у пузыря «срезается» верхний угол. */
      stackedAbove: boolean;
      /** Есть сообщение снизу в той же стопке — между ними меньше отступ. */
      stackedBelow: boolean;
    };

function isStacked(prev: Message | undefined, next: Message | undefined): boolean {
  return (
    !!prev &&
    !!next &&
    prev.direction === next.direction &&
    isSameDay(prev.timestamp, next.timestamp) &&
    next.timestamp - prev.timestamp < STACK_GAP_MS
  );
}

/** Лента чата: сообщения с разделителями дней и признаками склейки соседних пузырей. */
export function buildTimeline(messages: Message[], now = Date.now()): TimelineItem[] {
  const items: TimelineItem[] = [];
  messages.forEach((message, index) => {
    const prev = messages[index - 1];
    const next = messages[index + 1];
    if (!prev || !isSameDay(prev.timestamp, message.timestamp)) {
      items.push({
        type: 'day',
        key: `day-${message.timestamp}`,
        label: formatDayLabel(message.timestamp, now),
      });
    }
    items.push({
      type: 'message',
      key: message.id,
      message,
      stackedAbove: isStacked(prev, message),
      stackedBelow: isStacked(message, next),
    });
  });
  return items;
}
