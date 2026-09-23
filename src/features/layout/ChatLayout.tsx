import { useSessionStore } from '../../store/session';

export function ChatLayout() {
  const idInstance = useSessionStore((state) => state.credentials?.idInstance);
  const logout = useSessionStore((state) => state.logout);

  return (
    <div className="flex h-full">
      <aside className="flex w-full max-w-sm flex-col border-r border-border bg-surface">
        <header className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">Чаты</h1>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-surface-muted"
          >
            Выйти
          </button>
        </header>
        <div className="flex flex-1 items-center justify-center p-4 text-sm text-text-muted">
          Чатов пока нет
        </div>
        <footer className="border-t border-border px-4 py-2 text-xs text-text-muted">
          Инстанс {idInstance}
        </footer>
      </aside>

      <main className="hidden flex-1 items-center justify-center text-text-muted md:flex">
        Выберите чат
      </main>
    </div>
  );
}
