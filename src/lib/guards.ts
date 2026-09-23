/** Проверки для данных, пришедших извне (ответы и уведомления GREEN-API). */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function asString(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

/** Безопасный доступ к таблице по ключу извне: без обращения к прототипу (`constructor` и т.п.). */
export function lookup<T>(table: Record<string, T>, key: unknown): T | undefined {
  return typeof key === 'string' && Object.hasOwn(table, key) ? table[key] : undefined;
}
