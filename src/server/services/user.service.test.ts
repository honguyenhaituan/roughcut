import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from './user.service';
import { userRepository } from '@/server/repositories/user.repository';

vi.mock('@/server/repositories/user.repository', () => ({
  userRepository: { findByEmail: vi.fn(), create: vi.fn() },
}));
beforeEach(() => vi.clearAllMocks());

const mockedRepo = vi.mocked(userRepository);

describe('userService.register', () => {
  it('hashes the password and creates the user', async () => {
    mockedRepo.findByEmail.mockResolvedValue(null);
    mockedRepo.create.mockImplementation((email: string, hash: string) =>
      Promise.resolve({
        id: 'u1',
        email,
        passwordHash: hash,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    const user = await userService.register('a@b.com', 'password123');
    const [, hash] = mockedRepo.create.mock.calls[0];
    expect(hash).not.toBe('password123');
    expect(user.email).toBe('a@b.com');
  });
  it('rejects a duplicate email', async () => {
    mockedRepo.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      passwordHash: 'h',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(
      userService.register('a@b.com', 'password123'),
    ).rejects.toThrow(/already/i);
  });
});
describe('userService.login', () => {
  it('rejects wrong password', async () => {
    const bcrypt = await import('bcryptjs');
    mockedRepo.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      passwordHash: await bcrypt.default.hash('correct', 10),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(userService.login('a@b.com', 'wrong')).rejects.toThrow(
      /invalid/i,
    );
  });
});
