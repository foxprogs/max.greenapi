import { type SubmitEvent, useId, useState } from 'react';
import { ApiError } from '../../api/client';
import { getStateInstance } from '../../api/greenApi';
import type { Credentials, InstanceState } from '../../api/types';
import { MaxLogo } from '../../components/icons';
import { useSessionStore } from '../../store/session';

const STATE_ERRORS: Partial<Record<InstanceState, string>> = {
  notAuthorized: 'Инстанс не авторизован: привяжите аккаунт MAX в личном кабинете GREEN-API',
  blocked: 'Аккаунт MAX заблокирован',
  starting: 'Инстанс запускается, повторите попытку через минуту',
  sleepMode: 'Инстанс в спящем режиме',
  yellowCard: 'Отправка сообщений временно ограничена',
};

function validate({ apiUrl, idInstance, apiTokenInstance }: Credentials): string | null {
  if (!/^https?:\/\/\S+$/.test(apiUrl)) return 'Укажите apiUrl в формате https://…';
  if (!/^\d+$/.test(idInstance)) return 'idInstance должен состоять из цифр';
  if (!apiTokenInstance) return 'Укажите apiTokenInstance';
  return null;
}

export function LoginPage() {
  const login = useSessionStore((state) => state.login);
  const [form, setForm] = useState<Credentials>({
    apiUrl: '',
    idInstance: '',
    apiTokenInstance: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field: keyof Credentials) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const credentials: Credentials = {
      apiUrl: form.apiUrl.trim().replace(/\/+$/, ''),
      idInstance: form.idInstance.trim(),
      apiTokenInstance: form.apiTokenInstance.trim(),
    };

    const validationError = validate(credentials);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const { stateInstance } = await getStateInstance(credentials);
      if (stateInstance === 'authorized') {
        login(credentials);
        return;
      }
      setError(STATE_ERRORS[stateInstance] ?? `Инстанс недоступен: ${stateInstance}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось проверить учётные данные');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-full items-center justify-center bg-surface-muted p-4">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-sm rounded-2xl bg-surface p-8 shadow-sm"
      >
        <MaxLogo className="mx-auto mb-4 size-14" />
        <h1 className="mb-1 text-center text-2xl font-semibold">MAX Chat</h1>
        <p className="mb-6 text-center text-sm text-text-muted">
          Войдите с данными инстанса из{' '}
          <a
            href="https://console.green-api.com"
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            личного кабинета GREEN-API
          </a>
        </p>

        <div className="space-y-4">
          <Field
            label="apiUrl"
            value={form.apiUrl}
            onChange={update('apiUrl')}
            placeholder="https://1234.api.green-api.com"
            inputMode="url"
          />
          <Field
            label="idInstance"
            value={form.idInstance}
            onChange={update('idInstance')}
            placeholder="1101000001"
            inputMode="numeric"
          />
          <Field
            label="apiTokenInstance"
            value={form.apiTokenInstance}
            onChange={update('apiTokenInstance')}
            type="password"
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-xl bg-accent py-3 font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {isSubmitting ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </main>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'password';
  placeholder?: string;
  inputMode?: 'url' | 'numeric';
  autoComplete?: string;
};

function Field({
  label,
  onChange,
  type = 'text',
  autoComplete = 'off',
  ...inputProps
}: FieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-transparent bg-surface-muted px-4 py-2.5 outline-none transition-colors placeholder:text-text-muted focus:border-accent focus:bg-surface"
        {...inputProps}
      />
    </div>
  );
}
