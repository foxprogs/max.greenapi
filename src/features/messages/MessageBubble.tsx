import { formatTime } from '../../lib/format';
import type { Message, MessageStatus } from '../../types';

const STATUS_LABELS: Record<MessageStatus, string> = {
  pending: 'Отправляется',
  sent: 'Отправлено',
  delivered: 'Доставлено',
  read: 'Прочитано',
  error: 'Не отправлено',
};

type MessageBubbleProps = {
  message: Message;
  onRetry: () => void;
};

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const isOut = message.direction === 'out';

  return (
    <div
      className={`max-w-[75%] rounded-2xl px-3 py-1.5 ${
        isOut ? 'ml-auto rounded-br-md bg-accent text-white' : 'rounded-bl-md bg-surface'
      }`}
    >
      <p className="wrap-break-word whitespace-pre-wrap">{message.text}</p>
      <p
        className={`mt-0.5 flex items-center justify-end gap-1 text-[11px] ${
          isOut ? 'text-white/70' : 'text-text-muted'
        }`}
      >
        {formatTime(message.timestamp)}
        {isOut && <StatusIcon status={message.status} />}
      </p>
      {message.status === 'error' && (
        <p className="mt-1 text-xs">
          {message.error ?? STATUS_LABELS.error} ·{' '}
          <button type="button" onClick={onRetry} className="font-medium underline">
            Повторить
          </button>
        </p>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: MessageStatus }) {
  const label = STATUS_LABELS[status];
  if (status === 'error') return <span title={label}>!</span>;
  if (status === 'pending') return <span title={label}>🕓</span>;
  return (
    <span title={label} className={status === 'read' ? 'text-white' : undefined}>
      {status === 'sent' ? '✓' : '✓✓'}
    </span>
  );
}
