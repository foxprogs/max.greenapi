import { type SubmitEvent, useState } from 'react';
import { ApiError } from '../../api/client';
import { checkAccount } from '../../api/greenApi';
import type { Credentials } from '../../api/types';
import { normalizePhone } from '../../lib/phone';
import { useChatsStore } from '../../store/chats';

type NewChatFormProps = {
  credentials: Credentials;
  onCreated: () => void;
};

export function NewChatForm({ credentials, onCreated }: NewChatFormProps) {
  const openChat = useChatsStore((state) => state.openChat);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const phone = normalizePhone(value);
    if (!phone) {
      setError('Введите номер России или Беларуси, например +7 999 123-45-67');
      return;
    }

    // Чат с этим номером уже есть — не тратим проверку: их частота ограничена.
    const existing = Object.values(useChatsStore.getState().chats).find((c) => c.phone === phone);
    if (existing) {
      openChat(existing.id, phone);
      onCreated();
      return;
    }

    setIsChecking(true);
    try {
      const { exist, chatId } = await checkAccount(credentials, phone);
      if (!exist || !chatId) {
        setError('На этом номере нет аккаунта MAX');
        return;
      }
      openChat(chatId, phone);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось проверить номер');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="border-b border-border px-4 pb-3">
      <div className="flex gap-2">
        <input
          type="tel"
          inputMode="tel"
          autoComplete="off"
          // biome-ignore lint/a11y/noAutofocus: форма открывается по явному клику «Новый чат»
          autoFocus
          aria-label="Номер телефона получателя"
          placeholder="+7 999 123-45-67"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none transition-colors focus:border-accent focus:bg-surface"
        />
        <button
          type="submit"
          disabled={isChecking}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {isChecking ? 'Проверяем…' : 'Открыть'}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
