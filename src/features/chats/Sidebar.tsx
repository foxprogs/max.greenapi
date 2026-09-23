import { useMemo, useState } from 'react';
import type { Credentials } from '../../api/types';
import { CloseIcon, ComposeIcon, LogoutIcon } from '../../components/icons';
import type { PollingStatus } from '../../hooks/useNotificationPolling';
import { useChatsStore } from '../../store/chats';
import { confirmLogout, logout } from '../auth/logout';
import { ChatListItem } from './ChatListItem';
import { NewChatForm } from './NewChatForm';

const POLLING_LABELS: Record<PollingStatus, { text: string; color: string }> = {
  connecting: { text: 'Подключение…', color: 'bg-amber-400' },
  online: { text: 'В сети', color: 'bg-positive' },
  offline: { text: 'Нет связи, переподключаемся…', color: 'bg-danger' },
  unauthorized: { text: 'Нет доступа к инстансу', color: 'bg-danger' },
};

const headerButtonClass =
  'flex size-10 items-center justify-center rounded-full transition-colors hover:bg-surface-hover';

type SidebarProps = {
  credentials: Credentials;
  pollingStatus: PollingStatus;
};

export function Sidebar({ credentials, pollingStatus }: SidebarProps) {
  const { idInstance } = credentials;
  const chats = useChatsStore((state) => state.chats);
  const activeChatId = useChatsStore((state) => state.activeChatId);
  const selectChat = useChatsStore((state) => state.selectChat);
  const [isCreating, setIsCreating] = useState(false);

  const sortedChats = useMemo(
    () => Object.values(chats).sort((a, b) => b.updatedAt - a.updatedAt),
    [chats],
  );
  const polling = POLLING_LABELS[pollingStatus];

  return (
    <>
      <header className="flex items-center gap-2 px-4 pt-3 pb-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl leading-7 font-semibold">Чаты</h1>
          <p
            className="flex items-center gap-1.5 text-xs text-text-muted"
            title={`Инстанс ${idInstance}`}
          >
            <span className={`size-1.5 rounded-full ${polling.color}`} aria-hidden="true" />
            <span className="truncate" role="status">
              {polling.text}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreating((value) => !value)}
          aria-label={isCreating ? 'Отменить создание чата' : 'Новый чат'}
          aria-expanded={isCreating}
          title={isCreating ? 'Отмена' : 'Новый чат'}
          className={`${headerButtonClass} ${isCreating ? 'text-text-secondary' : 'text-accent'}`}
        >
          {isCreating ? <CloseIcon /> : <ComposeIcon />}
        </button>
        <button
          type="button"
          onClick={confirmLogout}
          aria-label="Выйти"
          title={`Выйти из инстанса ${idInstance}`}
          className={`${headerButtonClass} text-text-secondary md:hidden`}
        >
          <LogoutIcon />
        </button>
      </header>

      {pollingStatus === 'unauthorized' && (
        <div role="alert" className="mx-4 mb-3 rounded-xl bg-danger/10 px-3 py-2 text-sm">
          <p>
            Токен инстанса больше не действует или инстанс заблокирован — сообщения не приходят.
          </p>
          <button type="button" onClick={logout} className="mt-1 font-medium text-danger underline">
            Войти заново
          </button>
        </div>
      )}

      {isCreating && (
        <NewChatForm credentials={credentials} onCreated={() => setIsCreating(false)} />
      )}

      {sortedChats.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm text-text-muted">Чатов пока нет</p>
          {!isCreating && (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Написать по номеру
            </button>
          )}
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto px-2 pb-2">
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
    </>
  );
}
