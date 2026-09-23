import { resetHistoryCache } from '../../hooks/useChatHistory';
import { useChatsStore } from '../../store/chats';
import { useSessionStore } from '../../store/session';

/** Выход с удалением всех данных инстанса из браузера: кредов, чатов и переписки. */
export function logout() {
  // Сначала сессия: раскладка размонтируется и остановит опрос и загрузку истории.
  useSessionStore.getState().logout();
  useChatsStore.getState().reset();
  useChatsStore.persist.clearStorage();
  resetHistoryCache();
}

export function confirmLogout() {
  if (window.confirm('Выйти? Чаты и переписка будут удалены из этого браузера.')) logout();
}
