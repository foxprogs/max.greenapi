import { request } from './client';
import type {
  CheckAccountResponse,
  Credentials,
  DeleteNotificationResponse,
  GetChatHistoryRequest,
  GetStateInstanceResponse,
  HistoryMessage,
  ReceivedNotification,
  SendMessageRequest,
  SendMessageResponse,
} from './types';

export function getStateInstance(credentials: Credentials, signal?: AbortSignal) {
  return request<GetStateInstanceResponse>(credentials, 'getStateInstance', { signal });
}

export function sendMessage(credentials: Credentials, payload: SendMessageRequest) {
  return request<SendMessageResponse>(credentials, 'sendMessage', {
    httpMethod: 'POST',
    body: payload,
  });
}

/** chatId пользователя MAX по номеру; номер — только +7 или +375. */
export function checkAccount(credentials: Credentials, phone: string) {
  return request<CheckAccountResponse>(credentials, 'checkAccount', {
    httpMethod: 'POST',
    body: { phoneNumber: Number(phone) },
  });
}

/** Long polling: сервер держит запрос до `receiveTimeout` секунд (5–60). */
export function receiveNotification(
  credentials: Credentials,
  receiveTimeout: number,
  signal?: AbortSignal,
) {
  return request<ReceivedNotification | null>(credentials, 'receiveNotification', {
    query: { receiveTimeout },
    signal,
  });
}

export function deleteNotification(
  credentials: Credentials,
  receiptId: number,
  signal?: AbortSignal,
) {
  return request<DeleteNotificationResponse>(credentials, 'deleteNotification', {
    httpMethod: 'DELETE',
    pathSuffix: receiptId,
    signal,
  });
}

export function getChatHistory(
  credentials: Credentials,
  payload: GetChatHistoryRequest,
  signal?: AbortSignal,
) {
  return request<HistoryMessage[]>(credentials, 'getChatHistory', {
    httpMethod: 'POST',
    body: payload,
    signal,
  });
}
