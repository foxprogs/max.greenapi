import { type KeyboardEvent, type SubmitEvent, useLayoutEffect, useRef, useState } from 'react';
import { SendIcon } from '../../components/icons';
import { MAX_MESSAGE_LENGTH } from './sendText';

const MAX_HEIGHT_PX = 160;
/** Счётчик символов показываем, когда до лимита осталось меньше этого. */
const COUNTER_THRESHOLD = 500;

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

  const remaining = MAX_MESSAGE_LENGTH - text.length;

  return (
    <form onSubmit={handleSubmit} className="border-t border-border bg-surface px-3 py-3 md:px-6">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-black/6 bg-surface transition-colors focus-within:border-accent">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            maxLength={MAX_MESSAGE_LENGTH}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Сообщение"
            aria-label="Сообщение"
            className="block w-full resize-none bg-transparent px-3 py-2.5 leading-5 outline-none placeholder:text-text-muted"
          />
          {remaining <= COUNTER_THRESHOLD && (
            <span
              className={`self-end px-3 pb-1 text-xs ${remaining === 0 ? 'text-danger' : 'text-text-muted'}`}
            >
              {text.length}/{MAX_MESSAGE_LENGTH}
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={!trimmed}
          aria-label="Отправить"
          title="Отправить (Enter)"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-hover disabled:bg-surface-muted disabled:text-text-muted"
        >
          <SendIcon />
        </button>
      </div>
    </form>
  );
}
