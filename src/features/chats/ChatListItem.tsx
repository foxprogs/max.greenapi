import { Avatar } from '../../components/Avatar';
import { formatChatTime, getChatTitle } from '../../lib/format';
import { useChatsStore } from '../../store/chats';
import type { Chat } from '../../types';
import { MessageStatusIcon } from '../messages/MessageStatusIcon';

type ChatListItemProps = {
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
};

export function ChatListItem({ chat, isActive, onSelect }: ChatListItemProps) {
  const lastMessage = useChatsStore((state) => state.messages[chat.id]?.at(-1));
  const isOut = lastMessage?.direction === 'out';

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={isActive}
      className={`flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors ${
        isActive ? 'bg-accent-fade' : 'hover:bg-surface-hover'
      }`}
    >
      <Avatar chat={chat} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate font-semibold">{getChatTitle(chat)}</span>
          {lastMessage && (
            <span className="flex shrink-0 items-center gap-0.5 text-xs text-text-muted">
              {isOut && <MessageStatusIcon status={lastMessage.status} variant="list" />}
              {formatChatTime(lastMessage.timestamp)}
            </span>
          )}
        </span>
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm text-text-secondary">
            {lastMessage ? (
              <>
                {isOut && <span className="text-text">Вы: </span>}
                {lastMessage.text}
              </>
            ) : (
              <span className="text-text-muted">Нет сообщений</span>
            )}
          </span>
          {chat.unread > 0 && (
            <span className="min-w-5 shrink-0 rounded-full bg-accent px-1.5 text-center text-xs leading-5 font-semibold text-white">
              {chat.unread > 99 ? '99+' : chat.unread}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
