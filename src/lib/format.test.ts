import { describe, expect, it } from 'vitest';
import type { Chat } from '../types';
import { formatChatTime, formatDayLabel, formatTime, getInitials, isSameDay } from './format';

// Даты в локальной зоне: функции работают с календарными днями пользователя.
const NOW = new Date(2026, 8, 23, 15, 30).getTime(); // ср, 23 сентября 2026
const at = (month: number, day: number, hours = 12, minutes = 0, year = 2026) =>
  new Date(year, month - 1, day, hours, minutes).getTime();

const chat = (patch: Partial<Chat>): Chat => ({
  id: '10000002',
  phone: null,
  name: null,
  unread: 0,
  updatedAt: 0,
  ...patch,
});

describe('formatTime', () => {
  it('часы и минуты с ведущим нулём', () => {
    expect(formatTime(at(9, 23, 9, 5))).toBe('09:05');
  });
});

describe('formatChatTime', () => {
  it('сегодня — время', () => {
    expect(formatChatTime(at(9, 23, 0, 1), NOW)).toBe('00:01');
  });

  it('вчера — «Вчера», даже если прошло меньше суток', () => {
    expect(formatChatTime(at(9, 22, 23, 59), NOW)).toBe('Вчера');
  });

  it('в пределах недели — день недели', () => {
    expect(formatChatTime(at(9, 21), NOW)).toBe('пн');
  });

  it('раньше — дата', () => {
    expect(formatChatTime(at(9, 16), NOW)).toBe('16.09.26');
  });
});

describe('formatDayLabel', () => {
  it('сегодня и вчера — словами', () => {
    expect(formatDayLabel(at(9, 23, 1), NOW)).toBe('Сегодня');
    expect(formatDayLabel(at(9, 22, 23), NOW)).toBe('Вчера');
  });

  it('в этом году — без года', () => {
    expect(formatDayLabel(at(9, 1), NOW)).toBe('1 сентября');
  });

  it('в прошлом году — с годом', () => {
    expect(formatDayLabel(at(12, 31, 12, 0, 2025), NOW)).toBe('31 декабря 2025 г.');
  });
});

describe('isSameDay', () => {
  it('сравнивает календарные дни, а не 24 часа', () => {
    expect(isSameDay(at(9, 23, 0, 0), at(9, 23, 23, 59))).toBe(true);
    expect(isSameDay(at(9, 22, 23, 59), at(9, 23, 0, 0))).toBe(false);
  });
});

describe('getInitials', () => {
  it('по имени — первые буквы двух слов', () => {
    expect(getInitials(chat({ name: 'иван петров сидорович' }))).toBe('ИП');
    expect(getInitials(chat({ name: 'Анна' }))).toBe('А');
  });

  it('без имени — последние цифры номера или id', () => {
    expect(getInitials(chat({ phone: '79991234567' }))).toBe('67');
    expect(getInitials(chat({}))).toBe('02');
  });
});
