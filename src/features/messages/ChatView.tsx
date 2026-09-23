import type { Credentials } from '../../api/types';
import { Avatar } from '../../components/Avatar';
import { BackIcon } from '../../components/icons';
import { getChatTitle } from '../../lib/format';
import { formatPhone } from '../../lib/phone';
import { useChatsStore } from '../../store/chats';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import { retryMessage, sendText } from './sendText';

type ChatViewProps = {
  chatId: string;
  credentials: Credentials;
};

export function ChatView({ chatId, credentials }: ChatViewProps) {
  const chat = useChatsStore((state) => state.chats[chatId]);
  const selectChat = useChatsStore((state) => state.selectChat);

  if (!chat) return null;
  const title = getChatTitle(chat);
  const subtitle = chat.phone && chat.name ? formatPhone(chat.phone) : null;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface px-3 md:px-6">
        <button
          type="button"
          onClick={() => selectChat(null)}
          aria-label="Назад к списку чатов"
          className="flex size-10 items-center justify-center rounded-full text-accent transition-colors hover:bg-surface-hover md:hidden"
        >
          <BackIcon />
        </button>
        <Avatar chat={chat} size="md" />
        <div className="min-w-0">
          <h2 className="truncate font-semibold">{title}</h2>
          {subtitle && <p className="truncate text-[13px] text-text-muted">{subtitle}</p>}
        </div>
      </header>

      <MessageList
        chatId={chatId}
        onRetry={(messageId) => retryMessage(credentials, chatId, messageId)}
      />
      <MessageInput onSend={(text) => sendText(credentials, chatId, text)} />
    </>
  );
}
