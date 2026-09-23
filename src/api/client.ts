import type { Credentials } from './types';

export class ApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = {
  httpMethod?: 'GET' | 'POST' | 'DELETE';
  /** Дополнительный сегмент пути после токена, например receiptId. */
  pathSuffix?: string | number;
  query?: Record<string, string | number>;
  body?: unknown;
  signal?: AbortSignal;
};

export function buildUrl(
  credentials: Credentials,
  method: string,
  { pathSuffix, query }: Pick<RequestOptions, 'pathSuffix' | 'query'> = {},
): string {
  const base = credentials.apiUrl.trim().replace(/\/+$/, '');
  const segments = [
    base,
    `waInstance${credentials.idInstance}`,
    method,
    credentials.apiTokenInstance,
  ];
  if (pathSuffix !== undefined) segments.push(String(pathSuffix));

  const url = new URL(segments.join('/'));
  for (const [key, value] of Object.entries(query ?? {})) {
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function describeStatus(status: number): string {
  if (status === 401 || status === 403) return 'Неверный idInstance или apiTokenInstance';
  if (status === 429) return 'Слишком много запросов, попробуйте позже';
  if (status === 466) return 'Превышен лимит тарифа GREEN-API';
  if (status >= 500) return 'Сервер GREEN-API временно недоступен';
  return `Ошибка запроса (${status})`;
}

export async function request<T>(
  credentials: Credentials,
  method: string,
  { httpMethod = 'GET', body, signal, ...urlOptions }: RequestOptions = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(buildUrl(credentials, method, urlOptions), {
      method: httpMethod,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError('Нет соединения с сервером GREEN-API', null);
  }

  if (!response.ok) throw new ApiError(describeStatus(response.status), response.status);

  // receiveNotification при пустой очереди возвращает `null` или пустое тело.
  const text = await response.text();
  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError('Некорректный ответ сервера', response.status);
  }
}
