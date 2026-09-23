import type { Chat } from '../types';
import { formatPhone } from './phone';

const timeFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });

export function formatTime(timestamp: number): string {
  return timeFormat.format(timestamp);
}

export function getChatTitle(chat: Chat): string {
  if (chat.name) return chat.name;
  if (chat.phone) return formatPhone(chat.phone);
  return chat.id;
}
