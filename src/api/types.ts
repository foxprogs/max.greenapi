export type Credentials = {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
};

export type InstanceState =
  | 'authorized'
  | 'notAuthorized'
  | 'blocked'
  | 'starting'
  | 'yellowCard'
  | 'sleepMode';

export type GetStateInstanceResponse = {
  stateInstance: InstanceState;
};

export type SendMessageRequest = {
  chatId: string;
  message: string;
};

export type SendMessageResponse = {
  idMessage: string;
};

export type CheckAccountResponse = {
  exist: boolean;
  /** Внутренний id MAX пользователя с этим номером; пустой, если аккаунта нет. */
  chatId: string;
};

export type DeleteNotificationResponse = {
  result: boolean;
};

export type GetChatHistoryRequest = {
  chatId: string;
  count?: number;
};

/** Элемент ответа getChatHistory; массив отсортирован от новых к старым. */
export type HistoryMessage = {
  type: 'incoming' | 'outgoing';
  idMessage: string;
  /** Секунды. */
  timestamp: number;
  typeMessage: string;
  /** Внутренний id MAX, даже если запрашивали по номеру. */
  chatId: string;
  chatType?: string;
  textMessage?: string;
  extendedTextMessage?: { text?: string };
  /** Только у исходящих. */
  statusMessage?: 'sent' | 'delivered' | 'read';
  senderName?: string;
  senderContactName?: string;
  isDeleted?: boolean;
};

export type MessageWebhookType =
  | 'incomingMessageReceived'
  | 'outgoingMessageReceived'
  | 'outgoingAPIMessageReceived';

export type MessageWebhook = {
  typeWebhook: MessageWebhookType;
  idMessage: string;
  timestamp: number;
  senderData: {
    chatId: string;
    sender: string;
    senderName?: string;
    chatName?: string;
    chatType?: string;
    /** Во входящих — номер собеседника, в исходящих — наш номер. Приходит числом. */
    senderPhoneNumber?: number;
  };
  messageData: {
    typeMessage: string;
    textMessageData?: { textMessage: string };
    extendedTextMessageData?: { text: string };
  };
};

export type OutgoingMessageStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'noAccount';

/**
 * Тело уведомления приходит извне и может быть любого типа из десятков,
 * поэтому оно не типизировано жёстко: разбор выполняется через type guards.
 */
export type WebhookBody = { typeWebhook: string } & Record<string, unknown>;

export type ReceivedNotification = {
  receiptId: number;
  body: WebhookBody;
};
