import { jest } from '@jest/globals';

export const hash = jest.fn();
export const compare = jest.fn();

const bcryptMock = { hash, compare };
export default bcryptMock; 