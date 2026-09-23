import type { Chat } from '../types';
import { formatPhone } from './phone';

const LOCALE = 'ru-RU';
const DAY_MS = 24 * 60 * 60 * 1000;

const timeFormat = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' });
const weekdayFormat = new Intl.DateTimeFormat(LOCALE, { weekday: 'short' });
const shortDateFormat = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
});
const dayMonthFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long' });
const fullDateFormat = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** Сколько календарных дней прошло от timestamp до now: 0 — сегодня, 1 — вчера. */
function daysAgo(timestamp: number, now: number): number {
  return Math.round((startOfDay(now) - startOfDay(timestamp)) / DAY_MS);
}

export function isSameDay(a: number, b: number): boolean {
  return startOfDay(a) === startOfDay(b);
}

/** Время сообщения в пузыре: 14:05. */
export function formatTime(timestamp: number): string {
  return timeFormat.format(timestamp);
}

/** Время в списке чатов: сегодня — 14:05, вчера — «Вчера», на неделе — «пн», иначе 01.09.26. */
export function formatChatTime(timestamp: number, now = Date.now()): string {
  const days = daysAgo(timestamp, now);
  if (days <= 0) return formatTime(timestamp);
  if (days === 1) return 'Вчера';
  if (days < 7) return weekdayFormat.format(timestamp);
  return shortDateFormat.format(timestamp);
}

/** Разделитель дней в ленте: «Сегодня», «Вчера», «12 сентября», «12 сентября 2025 г.». */
export function formatDayLabel(timestamp: number, now = Date.now()): string {
  const days = daysAgo(timestamp, now);
  if (days === 0) return 'Сегодня';
  if (days === 1) return 'Вчера';
  const sameYear = new Date(timestamp).getFullYear() === new Date(now).getFullYear();
  return (sameYear ? dayMonthFormat : fullDateFormat).format(timestamp);
}

export function getChatTitle(chat: Chat): string {
  if (chat.name) return chat.name;
  if (chat.phone) return formatPhone(chat.phone);
  return chat.id;
}

/** Инициалы для аватара: «Иван Петров» → «ИП», номер → две последние цифры. */
export function getInitials(chat: Chat): string {
  if (chat.name) {
    const words = chat.name.trim().split(/\s+/).filter(Boolean);
    const letters = words.slice(0, 2).map((word) => Array.from(word)[0] ?? '');
    const initials = letters.join('').toUpperCase();
    if (initials) return initials;
  }
  const digits = (chat.phone ?? chat.id).replace(/\D/g, '');
  return digits.slice(-2) || '#';
}
