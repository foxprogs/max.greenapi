import { type KeyboardEvent, type SubmitEvent, useLayoutEffect, useRef, useState } from 'react';
import { MAX_MESSAGE_LENGTH } from './sendText';

const MAX_HEIGHT_PX = 160;

type MessageInputProps = {
  onSend: (text: string) => void;
};

export function MessageInput({ onSend }: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const trimmed = text.trim();

  // Авторост: подгоняем высоту под содержимое до MAX_HEIGHT_PX.
  // biome-ignore lint/correctness/useExhaustiveDependencies: пересчитываем при каждом изменении текста
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [text]);

  const submit = () => {
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter — отправить, Shift+Enter — перенос; во время IME-ввода Enter подтверждает слово.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 border-t border-border bg-surface px-4 py-3"
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={text}
        maxLength={MAX_MESSAGE_LENGTH}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Сообщение"
        aria-label="Сообщение"
        className="min-w-0 flex-1 resize-none rounded-xl bg-surface-muted px-3 py-2 outline-none"
      />
      <button
        type="submit"
        disabled={!trimmed}
        className="rounded-xl bg-accent px-4 py-2 font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        Отправить
      </button>
    </form>
  );
}
