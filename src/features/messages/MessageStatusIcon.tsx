import { AlertIcon, CheckIcon, ClockIcon, DoubleCheckIcon } from '../../components/icons';
import type { MessageStatus } from '../../types';

export const STATUS_LABELS: Record<MessageStatus, string> = {
  pending: 'Отправляется',
  sent: 'Отправлено',
  delivered: 'Доставлено',
  read: 'Прочитано',
  error: 'Не отправлено',
};

const ICONS = {
  pending: ClockIcon,
  sent: CheckIcon,
  delivered: DoubleCheckIcon,
  read: DoubleCheckIcon,
  error: AlertIcon,
} satisfies Record<MessageStatus, unknown>;

const LIST_COLORS: Partial<Record<MessageStatus, string>> = {
  read: 'text-accent',
  error: 'text-danger',
};

type MessageStatusIconProps = {
  status: MessageStatus;
  /** В пузыре цвет наследуется; в списке чатов «прочитано» и ошибка выделяются цветом. */
  variant?: 'bubble' | 'list';
};

export function MessageStatusIcon({ status, variant = 'bubble' }: MessageStatusIconProps) {
  const Icon = ICONS[status];
  const color = variant === 'list' ? LIST_COLORS[status] : undefined;
  return (
    <span role="img" aria-label={STATUS_LABELS[status]} title={STATUS_LABELS[status]}>
      <Icon className={`size-4 ${color ?? ''}`} />
    </span>
  );
}
