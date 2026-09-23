import { LoginPage } from './features/auth/LoginPage';
import { ChatLayout } from './features/layout/ChatLayout';
import { useSessionStore } from './store/session';

export function App() {
  const isLoggedIn = useSessionStore((state) => state.credentials !== null);
  return isLoggedIn ? <ChatLayout /> : <LoginPage />;
}
