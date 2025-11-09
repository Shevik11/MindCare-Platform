// Test findUserByHash script
jest.mock('../../db/db', () => {
  const mockPrisma = {
    users: {
      findMany: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return mockPrisma;
});

// Mock console
jest.spyOn(console, 'log').mockImplementation();
jest.spyOn(console, 'error').mockImplementation();

const prisma = require('../../db/db');

describe('findUserByHash script', () => {
  let findUserByHashScript;

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-require the script to get fresh module
    delete require.cache[require.resolve('../../scripts/findUserByHash')];
    findUserByHashScript = require('../../scripts/findUserByHash');
  });

  it('should find user with matching password hash', async () => {
    const hash = '$2b$10$testhash';
    const users = [
      {
        id: 1,
        email: 'user1@test.com',
        firstName: 'User',
        lastName: 'One',
        role: 'patient',
        password: 'differenthash',
      },
      {
        id: 2,
        email: 'user2@test.com',
        firstName: 'User',
        lastName: 'Two',
        role: 'psychologist',
        password: hash,
      },
    ];

    prisma.users.findMany.mockResolvedValue(users);

    const result = await findUserByHashScript.findUserByHash(hash);

    expect(result).not.toBeNull();
    expect(result.id).toBe(2);
    expect(result.email).toBe('user2@test.com');
    expect(result.password).toBe(hash);
    expect(prisma.users.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        password: true,
      },
    });
  });

  it('should return null when no user has matching hash', async () => {
    const hash = '$2b$10$testhash';
    const users = [
      {
        id: 1,
        email: 'user1@test.com',
        firstName: 'User',
        lastName: 'One',
        role: 'patient',
        password: 'differenthash1',
      },
      {
        id: 2,
        email: 'user2@test.com',
        firstName: 'User',
        lastName: 'Two',
        role: 'psychologist',
        password: 'differenthash2',
      },
    ];

    prisma.users.findMany.mockResolvedValue(users);

    const result = await findUserByHashScript.findUserByHash(hash);

    expect(result).toBeNull();
    expect(prisma.users.findMany).toHaveBeenCalled();
  });

  it('should return null when no users exist', async () => {
    const hash = '$2b$10$testhash';

    prisma.users.findMany.mockResolvedValue([]);

    const result = await findUserByHashScript.findUserByHash(hash);

    expect(result).toBeNull();
    expect(prisma.users.findMany).toHaveBeenCalled();
  });

  it('should handle database errors', async () => {
    const hash = '$2b$10$testhash';

    prisma.users.findMany.mockRejectedValue(new Error('Database error'));

    await expect(findUserByHashScript.findUserByHash(hash)).rejects.toThrow(
      'Database error'
    );
  });
});
