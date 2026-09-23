import { useEffect } from 'react';
import type { Credentials } from '../../api/types';
import { ChatsIcon, LogoutIcon, MaxLogo } from '../../components/icons';
import { useNotificationPolling } from '../../hooks/useNotificationPolling';
import { useChatsStore } from '../../store/chats';
import { confirmLogout } from '../auth/logout';
import { Sidebar } from '../chats/Sidebar';
import { ChatView } from '../messages/ChatView';

type ChatLayoutProps = {
  credentials: Credentials;
};

export function ChatLayout({ credentials }: ChatLayoutProps) {
  const pollingStatus = useNotificationPolling(credentials);
  const activeChatId = useChatsStore((state) => state.activeChatId);
  useUnreadTitle();

  return (
    <div className="flex h-dvh overflow-hidden">
      <nav
        aria-label="Разделы"
        className="hidden w-18 shrink-0 flex-col items-center gap-2 bg-surface-muted py-4 md:flex"
      >
        <MaxLogo className="mb-4 size-10" />
        <span
          aria-current="page"
          title="Чаты"
          className="flex size-11 items-center justify-center rounded-xl bg-accent-fade text-accent"
        >
          <ChatsIcon />
        </span>
        <button
          type="button"
          onClick={confirmLogout}
          title={`Выйти из инстанса ${credentials.idInstance}`}
          aria-label="Выйти"
          className="mt-auto flex size-11 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-surface-hover hover:text-danger"
        >
          <LogoutIcon />
        </button>
      </nav>

      {/* На мобильном показываем либо список, либо открытый чат. */}
      <aside
        className={`w-full min-w-0 flex-col border-border bg-surface md:flex md:w-90 md:shrink-0 md:border-r ${
          activeChatId ? 'hidden' : 'flex'
        }`}
      >
        <Sidebar credentials={credentials} pollingStatus={pollingStatus} />
      </aside>

      <main
        className={`min-w-0 flex-1 flex-col bg-chat md:flex ${activeChatId ? 'flex' : 'hidden'}`}
      >
        {activeChatId ? (
          <ChatView key={activeChatId} chatId={activeChatId} credentials={credentials} />
        ) : (
          <div className="flex flex-1 items-center justify-center p-4">
            <span className="rounded-full bg-capsule px-3 py-1 text-sm text-text-secondary">
              Выберите чат, чтобы начать общение
            </span>
          </div>
        )}
      </main>
    </div>
  );
}

/** Непрочитанные — в заголовке вкладки, чтобы их было видно из других вкладок. */
function useUnreadTitle() {
  const unread = useChatsStore((state) =>
    Object.values(state.chats).reduce((sum, chat) => sum + chat.unread, 0),
  );
  useEffect(() => {
    const baseTitle = document.title;
    document.title = unread > 0 ? `(${unread}) ${baseTitle}` : baseTitle;
    return () => {
      document.title = baseTitle;
    };
  }, [unread]);
}
