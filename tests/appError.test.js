const AppError = require('../utils/AppError');

describe('AppError', () => {
  test('sets message and statusCode correctly (success case)', () => {
    const err = new AppError('Not found', 404);
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
    expect(err.status).toBe('fail');
    expect(err.isOperational).toBe(true);
  });

  test('marks 5xx codes with status "error"', () => {
    const err = new AppError('Server exploded', 500);
    expect(err.status).toBe('error');
  });

  test('defaults to statusCode 500 when none is provided (failure/edge case)', () => {
    const err = new AppError('Something broke');
    expect(err.statusCode).toBe(500);
    expect(err.status).toBe('error');
  });

  test('is an instance of Error and carries a stack trace', () => {
    const err = new AppError('Boom', 400);
    expect(err).toBeInstanceOf(Error);
    expect(typeof err.stack).toBe('string');
  });
});
