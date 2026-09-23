import { useMemo, useState } from 'react';
import type { Credentials } from '../../api/types';
import type { PollingStatus } from '../../hooks/useNotificationPolling';
import { useChatsStore } from '../../store/chats';
import { useSessionStore } from '../../store/session';
import { ChatListItem } from './ChatListItem';
import { NewChatForm } from './NewChatForm';

const POLLING_LABELS: Record<PollingStatus, { text: string; color: string }> = {
  connecting: { text: 'Подключение…', color: 'bg-amber-400' },
  online: { text: 'Онлайн', color: 'bg-emerald-500' },
  offline: { text: 'Нет связи, переподключаемся…', color: 'bg-danger' },
};

type SidebarProps = {
  credentials: Credentials;
  pollingStatus: PollingStatus;
};

export function Sidebar({ credentials, pollingStatus }: SidebarProps) {
  const { idInstance } = credentials;
  const chats = useChatsStore((state) => state.chats);
  const activeChatId = useChatsStore((state) => state.activeChatId);
  const selectChat = useChatsStore((state) => state.selectChat);
  const logout = useSessionStore((state) => state.logout);
  const [isCreating, setIsCreating] = useState(false);

  const sortedChats = useMemo(
    () => Object.values(chats).sort((a, b) => b.updatedAt - a.updatedAt),
    [chats],
  );
  const polling = POLLING_LABELS[pollingStatus];

  return (
    <>
      <header className="flex items-center justify-between gap-2 px-4 py-3">
        <h1 className="text-lg font-semibold">Чаты</h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsCreating((value) => !value)}
            className="rounded-lg px-3 py-1.5 text-sm text-accent transition-colors hover:bg-surface-muted"
          >
            {isCreating ? 'Отмена' : 'Новый чат'}
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-surface-muted"
          >
            Выйти
          </button>
        </div>
      </header>

      {isCreating && (
        <NewChatForm credentials={credentials} onCreated={() => setIsCreating(false)} />
      )}

      {sortedChats.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-4 text-center text-sm text-text-muted">
          Чатов пока нет — начните новый по номеру телефона
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto">
          {sortedChats.map((chat) => (
            <li key={chat.id}>
              <ChatListItem
                chat={chat}
                isActive={chat.id === activeChatId}
                onSelect={() => selectChat(chat.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <footer className="flex items-center gap-2 border-t border-border px-4 py-2 text-xs text-text-muted">
        <span className={`size-2 rounded-full ${polling.color}`} aria-hidden="true" />
        <span>{polling.text}</span>
        <span className="ml-auto">Инстанс {idInstance}</span>
      </footer>
    </>
  );
}
