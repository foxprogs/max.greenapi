import { describe, expect, it } from 'vitest';
import { formatPhone, normalizePhone } from './phone';

describe('normalizePhone', () => {
  it.each([
    ['+7 (999) 123-45-67', '79991234567'],
    ['79991234567', '79991234567'],
    ['8 999 123 45 67', '79991234567'],
    ['9991234567', '79991234567'],
    ['+375 29 123-45-67', '375291234567'],
  ])('normalizes %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(['', '   ', '12345', 'abc', '+7 999 123 45 67 ext', '+7 999 123 45 678'])(
    'rejects %j',
    (input) => {
      expect(normalizePhone(input)).toBeNull();
    },
  );

  it('rejects countries other than Russia and Belarus', () => {
    expect(normalizePhone('+86 131 2345 6789')).toBeNull();
    expect(normalizePhone('+8 999 123 45 67')).toBeNull();
  });
});

describe('formatPhone', () => {
  it('formats Russian numbers', () => {
    expect(formatPhone('79991234567')).toBe('+7 999 123-45-67');
  });

  it('prefixes other numbers with +', () => {
    expect(formatPhone('375291234567')).toBe('+375291234567');
  });
});
