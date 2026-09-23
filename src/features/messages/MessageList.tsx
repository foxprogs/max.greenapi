import { type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownIcon } from '../../components/icons';
import type { HistoryStatus } from '../../hooks/useChatHistory';
import { useChatsStore } from '../../store/chats';
import type { Message } from '../../types';
import { MessageBubble } from './MessageBubble';
import { buildTimeline } from './timeline';

const NO_MESSAGES: Message[] = [];
/** Ближе этого к низу считаем, что пользователь «внизу» и ленту можно докручивать. */
const BOTTOM_THRESHOLD_PX = 80;

function scrollToBottom(container: HTMLElement | null, behavior: ScrollBehavior = 'instant') {
  container?.scrollTo({ top: container.scrollHeight, behavior });
}

type MessageListProps = {
  chatId: string;
  history: { status: HistoryStatus; error: string | null; retry: () => void };
  onRetry: (messageId: string) => void;
};

export function MessageList({ chatId, history, onRetry }: MessageListProps) {
  const messages = useChatsStore((state) => state.messages[chatId] ?? NO_MESSAGES);
  const timeline = useMemo(() => buildTimeline(messages), [messages]);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const lastScrollTopRef = useRef(0);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const lastMessage = messages.at(-1);
  const isOwnPending = lastMessage?.direction === 'out' && lastMessage.status === 'pending';

  // Прилипание к низу: пока пользователь внизу, любое изменение высоты ленты (новое сообщение,
  // строка ошибки, растущее поле ввода) докручивает её. Если он читает историю — не мешаем.
  // При открытии чата isAtBottomRef = true, поэтому лента сразу открывается внизу.
  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;
    const observer = new ResizeObserver(() => {
      if (isAtBottomRef.current) scrollToBottom(container);
    });
    observer.observe(container);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  // Своё только что отправленное сообщение показываем, даже если лента была прокручена вверх.
  useLayoutEffect(() => {
    if (!isOwnPending) return;
    isAtBottomRef.current = true;
    scrollToBottom(containerRef.current);
  }, [isOwnPending]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    // «Ушёл от низа» — только если пользователь сам крутит вверх. Событие от нашей докрутки
    // может прийти, когда лента уже снова выросла, и не должно отключать прилипание.
    if (scrollHeight - scrollTop - clientHeight < BOTTOM_THRESHOLD_PX) {
      isAtBottomRef.current = true;
    } else if (scrollTop < lastScrollTopRef.current) {
      isAtBottomRef.current = false;
    }
    lastScrollTopRef.current = scrollTop;
    setShowScrollButton(!isAtBottomRef.current);
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="scrollbar-chat flex-1 overflow-y-auto"
      >
        <div ref={contentRef} className="flex min-h-full flex-col">
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-4">
              {history.status === 'loaded' ? (
                <Capsule>Сообщений пока нет — напишите первым</Capsule>
              ) : (
                <HistoryNotice history={history} />
              )}
            </div>
          ) : (
            <>
              {history.status !== 'loaded' && (
                <div className="flex justify-center px-4 pt-3">
                  <HistoryNotice history={history} />
                </div>
              )}
              <ul className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-end px-3 py-3 md:px-6">
                {timeline.map((item) =>
                  item.type === 'day' ? (
                    <li key={item.key} className="my-2 flex justify-center">
                      <span className="rounded-full bg-capsule px-3 py-0.5 text-[13px] font-medium text-text-secondary">
                        {item.label}
                      </span>
                    </li>
                  ) : (
                    <li key={item.key} className={item.stackedBelow ? 'mb-0.5' : 'mb-2'}>
                      <MessageBubble
                        message={item.message}
                        stackedAbove={item.stackedAbove}
                        stackedBelow={item.stackedBelow}
                        onRetry={() => onRetry(item.message.id)}
                      />
                    </li>
                  ),
                )}
              </ul>
            </>
          )}
        </div>
      </div>

      {showScrollButton && (
        <button
          type="button"
          onClick={() => scrollToBottom(containerRef.current, 'smooth')}
          aria-label="К последним сообщениям"
          className="absolute right-4 bottom-4 flex size-11 items-center justify-center rounded-full border border-border bg-surface text-text-secondary shadow-md transition-colors hover:text-accent"
        >
          <ArrowDownIcon />
        </button>
      )}
    </div>
  );
}

function Capsule({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-capsule px-3 py-1 text-sm text-text-secondary">
      {children}
    </span>
  );
}

/** Идёт подгрузка истории или она не удалась (с кнопкой повтора). */
function HistoryNotice({ history }: Pick<MessageListProps, 'history'>) {
  if (history.status !== 'error') {
    return (
      <span role="status">
        <Capsule>Загружаем историю…</Capsule>
      </span>
    );
  }
  return (
    <span role="alert">
      <Capsule>
        <span className="text-danger">{history.error ?? 'Не удалось загрузить историю'}</span> ·{' '}
        <button type="button" onClick={history.retry} className="font-medium text-accent">
          Повторить
        </button>
      </Capsule>
    </span>
  );
}
