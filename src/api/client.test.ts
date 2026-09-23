import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, buildUrl, request } from './client';
import type { Credentials } from './types';

const credentials: Credentials = {
  apiUrl: 'https://1234.api.green-api.com/',
  idInstance: '1101000001',
  apiTokenInstance: 'token',
};

function mockFetch(response: Response | Error) {
  const fn = vi.fn(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('buildUrl', () => {
  it('builds method URL and trims trailing slash of apiUrl', () => {
    expect(buildUrl(credentials, 'getStateInstance')).toBe(
      'https://1234.api.green-api.com/waInstance1101000001/getStateInstance/token',
    );
  });

  it('appends path suffix and query params', () => {
    expect(buildUrl(credentials, 'deleteNotification', { pathSuffix: 42 })).toBe(
      'https://1234.api.green-api.com/waInstance1101000001/deleteNotification/token/42',
    );
    expect(buildUrl(credentials, 'receiveNotification', { query: { receiveTimeout: 20 } })).toBe(
      'https://1234.api.green-api.com/waInstance1101000001/receiveNotification/token?receiveTimeout=20',
    );
  });
});

describe('request', () => {
  it('sends JSON body and parses JSON response', async () => {
    const fetchMock = mockFetch(new Response('{"idMessage":"abc"}'));

    await expect(
      request(credentials, 'sendMessage', { httpMethod: 'POST', body: { message: 'hi' } }),
    ).resolves.toEqual({ idMessage: 'abc' });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/sendMessage/token'),
      expect.objectContaining({
        method: 'POST',
        body: '{"message":"hi"}',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('returns null for empty body and for literal null', async () => {
    mockFetch(new Response(''));
    await expect(request(credentials, 'receiveNotification')).resolves.toBeNull();

    mockFetch(new Response('null'));
    await expect(request(credentials, 'receiveNotification')).resolves.toBeNull();
  });

  it('maps HTTP errors to ApiError with a readable message', async () => {
    mockFetch(new Response('', { status: 401 }));
    const error = await request(credentials, 'getStateInstance').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 401,
      message: 'Неверный idInstance или apiTokenInstance',
    });
  });

  it('explains the Developer tariff chat limit from the 466 body', async () => {
    mockFetch(
      new Response(
        JSON.stringify({
          invokeStatus: { method: 'sendmessage', status: 'QUOTE_ALLOWED' },
          correspondentsStatus: {
            method: 'correspondents',
            used: 3,
            total: 3,
            status: 'CORRESPONDENTS_QUOTE_EXCEEDED',
          },
        }),
        { status: 466 },
      ),
    );
    await expect(request(credentials, 'sendMessage')).rejects.toMatchObject({
      status: 466,
      message: expect.stringContaining('не больше 3 чатов'),
    });

    mockFetch(new Response('not json', { status: 466 }));
    await expect(request(credentials, 'sendMessage')).rejects.toMatchObject({
      message: 'Превышен лимит тарифа GREEN-API',
    });
  });

  it('asks to pause after too many number checks (469)', async () => {
    mockFetch(new Response('', { status: 469 }));
    await expect(request(credentials, 'checkAccount')).rejects.toMatchObject({
      status: 469,
      message: expect.stringContaining('повторите через пару часов'),
    });
  });

  it('tells a blocked instance from wrong credentials', async () => {
    mockFetch(new Response('', { status: 403 }));
    await expect(request(credentials, 'sendMessage')).rejects.toMatchObject({
      status: 403,
      message: expect.stringContaining('Доступ запрещён'),
    });
  });

  it('maps network failures to ApiError without status', async () => {
    mockFetch(new TypeError('Failed to fetch'));
    await expect(request(credentials, 'getStateInstance')).rejects.toMatchObject({
      name: 'ApiError',
      status: null,
    });
  });

  it('rethrows abort errors as is', async () => {
    const controller = new AbortController();
    controller.abort();
    const abortError = new DOMException('Aborted', 'AbortError');
    mockFetch(abortError);

    await expect(
      request(credentials, 'receiveNotification', { signal: controller.signal }),
    ).rejects.toBe(abortError);
  });
});
