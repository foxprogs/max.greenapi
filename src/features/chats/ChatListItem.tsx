import { formatTime, getChatTitle } from '../../lib/format';
import { useChatsStore } from '../../store/chats';
import type { Chat } from '../../types';

type ChatListItemProps = {
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
};

export function ChatListItem({ chat, isActive, onSelect }: ChatListItemProps) {
  const lastMessage = useChatsStore((state) => state.messages[chat.id]?.at(-1));

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={isActive}
      className={`flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-colors ${
        isActive ? 'bg-accent/10' : 'hover:bg-surface-muted'
      }`}
    >
      <span className="flex items-baseline gap-2">
        <span className="min-w-0 flex-1 truncate font-medium">{getChatTitle(chat)}</span>
        {lastMessage && (
          <span className="shrink-0 text-xs text-text-muted">
            {formatTime(lastMessage.timestamp)}
          </span>
        )}
      </span>
      <span className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm text-text-muted">
          {lastMessage
            ? `${lastMessage.direction === 'out' ? 'Вы: ' : ''}${lastMessage.text}`
            : 'Нет сообщений'}
        </span>
        {chat.unread > 0 && (
          <span className="shrink-0 rounded-full bg-accent px-1.5 text-xs leading-5 font-medium text-white">
            {chat.unread}
          </span>
        )}
      </span>
    </button>
  );
}
