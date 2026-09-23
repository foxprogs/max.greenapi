import { formatTime } from '../../lib/format';
import type { Message } from '../../types';
import { MessageStatusIcon, STATUS_LABELS } from './MessageStatusIcon';

type MessageBubbleProps = {
  message: Message;
  /** Есть сообщение сверху в той же стопке — верхний угол со стороны отправителя меньше. */
  stackedAbove: boolean;
  onRetry: () => void;
};

export function MessageBubble({ message, stackedAbove, onRetry }: MessageBubbleProps) {
  const isOut = message.direction === 'out';
  const meta = (
    <>
      {formatTime(message.timestamp)}
      {isOut && <MessageStatusIcon status={message.status} />}
    </>
  );

  return (
    <div
      className={`flex max-w-[min(80%,36rem)] flex-col ${isOut ? 'ml-auto items-end' : 'items-start'}`}
    >
      <div
        className={`relative rounded-2xl px-3 py-1.5 ${
          isOut
            ? `bg-bubble-out-gradient rounded-br-md text-white ${stackedAbove ? 'rounded-tr-md' : ''}`
            : `bg-bubble-in rounded-bl-md ${stackedAbove ? 'rounded-tl-md' : ''}`
        } ${message.status === 'error' ? 'opacity-70' : ''}`}
      >
        <p className="wrap-break-word whitespace-pre-wrap">
          {message.text}
          {/* Невидимая копия времени резервирует место, чтобы текст не наезжал на него. */}
          <span className="invisible ml-2 inline-flex gap-0.5 text-xs" aria-hidden="true">
            {meta}
          </span>
        </p>
        <span
          className={`absolute right-3 bottom-1 flex items-center gap-0.5 text-xs ${
            isOut ? 'text-white/65' : 'text-text-muted'
          }`}
        >
          {meta}
        </span>
      </div>

      {message.status === 'error' && (
        <p className="mt-1 px-1 text-xs text-danger">
          {message.error ?? STATUS_LABELS.error} ·{' '}
          <button type="button" onClick={onRetry} className="font-medium underline">
            Повторить
          </button>
        </p>
      )}
    </div>
  );
}
