const asyncHandler = require('../utils/asyncHandler');

describe('asyncHandler', () => {
  test('calls the wrapped function and does not call next() on success', async () => {
    const req = {};
    const res = {};
    const next = jest.fn();

    const handler = asyncHandler(async (rq, rs) => {
      rs.done = true;
    });

    await handler(req, res, next);

    expect(res.done).toBe(true);
    expect(next).not.toHaveBeenCalled();
  });

  test('forwards a rejected promise to next() instead of throwing (failure case)', async () => {
    const req = {};
    const res = {};
    const next = jest.fn();
    const error = new Error('Something went wrong');

    const handler = asyncHandler(async () => {
      throw error;
    });

    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  test('passes through the req, res, and next arguments unchanged', async () => {
    const req = { id: 1 };
    const res = { id: 2 };
    const next = jest.fn();
    const fn = jest.fn().mockResolvedValue(undefined);

    const handler = asyncHandler(fn);
    await handler(req, res, next);

    expect(fn).toHaveBeenCalledWith(req, res, next);
  });
});
