import type { Credentials } from '../../api/types';
import { useNotificationPolling } from '../../hooks/useNotificationPolling';
import { useChatsStore } from '../../store/chats';
import { Sidebar } from '../chats/Sidebar';
import { ChatView } from '../messages/ChatView';

type ChatLayoutProps = {
  credentials: Credentials;
};

export function ChatLayout({ credentials }: ChatLayoutProps) {
  const pollingStatus = useNotificationPolling(credentials);
  const activeChatId = useChatsStore((state) => state.activeChatId);

  return (
    <div className="flex h-full">
      {/* На мобильном показываем либо список, либо открытый чат. */}
      <aside
        className={`w-full flex-col border-r border-border bg-surface md:flex md:max-w-sm ${
          activeChatId ? 'hidden' : 'flex'
        }`}
      >
        <Sidebar credentials={credentials} pollingStatus={pollingStatus} />
      </aside>

      <main className={`min-w-0 flex-1 flex-col md:flex ${activeChatId ? 'flex' : 'hidden'}`}>
        {activeChatId ? (
          <ChatView key={activeChatId} chatId={activeChatId} credentials={credentials} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-text-muted">
            Выберите чат
          </div>
        )}
      </main>
    </div>
  );
}
