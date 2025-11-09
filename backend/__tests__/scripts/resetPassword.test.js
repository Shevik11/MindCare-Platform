// Test resetPassword script
const bcrypt = require('bcryptjs');

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('../../db/db', () => {
  const mockPrisma = {
    users: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return mockPrisma;
});

// Mock console
jest.spyOn(console, 'log').mockImplementation();
jest.spyOn(console, 'error').mockImplementation();

const prisma = require('../../db/db');

describe('resetPassword script', () => {
  let resetPasswordScript;

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-require the script to get fresh module
    delete require.cache[require.resolve('../../scripts/resetPassword')];
    resetPasswordScript = require('../../scripts/resetPassword');
  });

  it('should reset password for existing user', async () => {
    const email = 'user@test.com';
    const newPassword = 'newPassword123';
    const hashedPassword = 'hashedNewPassword';

    const user = {
      id: 1,
      email,
      firstName: 'User',
      lastName: 'Test',
      password: 'oldHashedPassword',
    };

    prisma.users.findUnique.mockResolvedValue(user);
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue(hashedPassword);
    prisma.users.update.mockResolvedValue({
      ...user,
      password: hashedPassword,
    });

    const result = await resetPasswordScript.resetPassword(email, newPassword);

    expect(result.success).toBe(true);
    expect(result.hashedPassword).toBe(hashedPassword);
    expect(prisma.users.findUnique).toHaveBeenCalledWith({ where: { email } });
    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 'salt');
    expect(prisma.users.update).toHaveBeenCalledWith({
      where: { email },
      data: {
        password: hashedPassword,
      },
    });
  });

  it('should return error when user does not exist', async () => {
    const email = 'nonexistent@test.com';
    const newPassword = 'newPassword123';

    prisma.users.findUnique.mockResolvedValue(null);

    const result = await resetPasswordScript.resetPassword(email, newPassword);

    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
    expect(prisma.users.findUnique).toHaveBeenCalledWith({ where: { email } });
    expect(bcrypt.genSalt).not.toHaveBeenCalled();
    expect(prisma.users.update).not.toHaveBeenCalled();
  });

  it('should handle database errors when finding user', async () => {
    const email = 'user@test.com';
    const newPassword = 'newPassword123';

    prisma.users.findUnique.mockRejectedValue(new Error('Database error'));

    await expect(
      resetPasswordScript.resetPassword(email, newPassword)
    ).rejects.toThrow('Database error');
  });

  it('should handle database errors when updating user', async () => {
    const email = 'user@test.com';
    const newPassword = 'newPassword123';

    const user = {
      id: 1,
      email,
      password: 'oldHashedPassword',
    };

    prisma.users.findUnique.mockResolvedValue(user);
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('hashedPassword');
    prisma.users.update.mockRejectedValue(new Error('Update error'));

    await expect(
      resetPasswordScript.resetPassword(email, newPassword)
    ).rejects.toThrow('Update error');
  });
});
