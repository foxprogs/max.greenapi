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
  if (status === 401) return 'Неверный idInstance или apiTokenInstance';
  if (status === 403) return 'Доступ запрещён: инстанс заблокирован или ограничен';
  if (status === 429) return 'Слишком много запросов, попробуйте позже';
  if (status === 466) return 'Превышен лимит тарифа GREEN-API';
  if (status === 469) return 'Слишком много проверок номеров, повторите через пару часов';
  if (status >= 500) return 'Сервер GREEN-API временно недоступен';
  return `Ошибка запроса (${status})`;
}

/**
 * 466 приходит и при исчерпании квоты метода, и при лимите собеседников на тарифе
 * «Разработчик» (3 чата в месяц) — второй случай различаем по телу ответа.
 */
function isCorrespondentsLimit(body: string): boolean {
  try {
    // Любое JSON-значение безопасно: у чисел и строк нужного поля просто не будет.
    const parsed = JSON.parse(body) as { correspondentsStatus?: { status?: unknown } } | null;
    return parsed?.correspondentsStatus?.status === 'CORRESPONDENTS_QUOTE_EXCEEDED';
  } catch {
    return false;
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  if (response.status === 466 && isCorrespondentsLimit(await response.text().catch(() => ''))) {
    return new ApiError(
      'Лимит тарифа «Разработчик»: не больше 3 чатов в месяц. Напишите в один из прежних чатов',
      response.status,
    );
  }
  return new ApiError(describeStatus(response.status), response.status);
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

  if (!response.ok) throw await toApiError(response);

  // receiveNotification при пустой очереди возвращает `null` или пустое тело.
  const text = await response.text();
  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError('Некорректный ответ сервера', response.status);
  }
}
