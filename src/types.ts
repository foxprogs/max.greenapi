/** Доменная модель чата — то, что хранится в сторе и рисуется в UI. */

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'error';

export type Message = {
  /** idMessage из GREEN-API; у ещё не отправленных — временный `local-…`. */
  id: string;
  text: string;
  direction: 'in' | 'out';
  /** Миллисекунды. */
  timestamp: number;
  status: MessageStatus;
  error?: string;
};

export type Chat = {
  /** Внутренний id MAX собеседника: из checkAccount или из уведомлений. */
  id: string;
  /** Номер собеседника цифрами, если известен. */
  phone: string | null;
  /** Имя собеседника из уведомлений (`senderData.chatName`). */
  name: string | null;
  unread: number;
  /** Время последнего события, мс — для сортировки списка. */
  updatedAt: number;
};
