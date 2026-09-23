import { LoginPage } from './features/auth/LoginPage';
import { ChatLayout } from './features/layout/ChatLayout';
import { useSessionStore } from './store/session';

export function App() {
  const credentials = useSessionStore((state) => state.credentials);
  return credentials ? <ChatLayout credentials={credentials} /> : <LoginPage />;
}
