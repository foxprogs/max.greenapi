import { useEffect, useRef } from 'react';
import { useChatsStore } from '../../store/chats';
import type { Message } from '../../types';
import { MessageBubble } from './MessageBubble';

const NO_MESSAGES: Message[] = [];

type MessageListProps = {
  chatId: string;
  onRetry: (messageId: string) => void;
};

export function MessageList({ chatId, onRetry }: MessageListProps) {
  const messages = useChatsStore((state) => state.messages[chatId] ?? NO_MESSAGES);
  const bottomRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: прокручиваем при каждом новом сообщении
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
        Сообщений пока нет
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      <ul className="flex flex-col gap-1.5">
        {messages.map((message) => (
          <li key={message.id} className="flex">
            <MessageBubble message={message} onRetry={() => onRetry(message.id)} />
          </li>
        ))}
      </ul>
      <div ref={bottomRef} />
    </div>
  );
}
