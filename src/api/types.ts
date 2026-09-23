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

export type DeleteNotificationResponse = {
  result: boolean;
};

export type GetChatHistoryRequest = {
  chatId: string;
  count?: number;
};

export type HistoryMessage = {
  type: 'incoming' | 'outgoing';
  idMessage: string;
  timestamp: number;
  typeMessage: string;
  chatId: string;
  textMessage?: string;
  statusMessage?: string;
  senderName?: string;
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
