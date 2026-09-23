import { getInitials } from '../lib/format';
import type { Chat } from '../types';

// Градиенты аватаров из палитры web.max.ru.
const GRADIENTS = [
  ['#ff48b6', '#ff8a35'],
  ['#ffc93d', '#ff832a'],
  ['#14e1d5', '#03c722'],
  ['#08d7f3', '#5398ff'],
  ['#bf97ff', '#526eff'],
] as const;

function pickGradient(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length] ?? GRADIENTS[0];
}

type AvatarProps = {
  chat: Chat;
  size?: 'md' | 'lg';
};

export function Avatar({ chat, size = 'lg' }: AvatarProps) {
  const [from, to] = pickGradient(chat.id);
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none ${
        size === 'lg' ? 'size-12 text-base' : 'size-10 text-sm'
      }`}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {getInitials(chat)}
    </span>
  );
}
