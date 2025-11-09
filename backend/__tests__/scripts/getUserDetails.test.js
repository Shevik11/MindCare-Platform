// Test getUserDetails script
jest.mock('../../db/db', () => {
  const mockPrisma = {
    users: {
      findUnique: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return mockPrisma;
});

// Mock console
jest.spyOn(console, 'log').mockImplementation();
jest.spyOn(console, 'error').mockImplementation();

const prisma = require('../../db/db');

describe('getUserDetails script', () => {
  let getUserDetailsScript;

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-require the script to get fresh module
    delete require.cache[require.resolve('../../scripts/getUserDetails')];
    getUserDetailsScript = require('../../scripts/getUserDetails');
  });

  it('should return user details when user exists', async () => {
    const userId = 1;
    const user = {
      id: userId,
      email: 'user@test.com',
      firstName: 'User',
      lastName: 'Test',
      role: 'patient',
      createdAt: new Date(),
      updatedAt: new Date(),
      photoUrl: null,
      password: 'hashedPassword',
      Psychologists: [],
    };

    prisma.users.findUnique.mockResolvedValue(user);

    const result = await getUserDetailsScript.getUserDetails(userId);

    expect(result).not.toBeNull();
    expect(result.id).toBe(userId);
    expect(result.email).toBe('user@test.com');
    expect(prisma.users.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
      include: {
        Psychologists: true,
      },
    });
  });

  it('should return user with psychologist profile when user is psychologist', async () => {
    const userId = 1;
    const user = {
      id: userId,
      email: 'psych@test.com',
      firstName: 'Psychologist',
      lastName: 'User',
      role: 'psychologist',
      createdAt: new Date(),
      updatedAt: new Date(),
      photoUrl: null,
      password: 'hashedPassword',
      Psychologists: [
        {
          id: 1,
          specialization: 'Clinical Psychology',
          experience: 5,
          price: 100.0,
        },
      ],
    };

    prisma.users.findUnique.mockResolvedValue(user);

    const result = await getUserDetailsScript.getUserDetails(userId);

    expect(result).not.toBeNull();
    expect(result.Psychologists).toHaveLength(1);
    expect(result.Psychologists[0].specialization).toBe('Clinical Psychology');
    expect(result.Psychologists[0].experience).toBe(5);
  });

  it('should return undefined when user does not exist', async () => {
    const userId = 999;

    prisma.users.findUnique.mockResolvedValue(null);

    const result = await getUserDetailsScript.getUserDetails(userId);

    expect(result).toBeUndefined();
    expect(prisma.users.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
      include: {
        Psychologists: true,
      },
    });
  });

  it('should handle database errors', async () => {
    const userId = 1;

    prisma.users.findUnique.mockRejectedValue(new Error('Database error'));

    await expect(getUserDetailsScript.getUserDetails(userId)).rejects.toThrow(
      'Database error'
    );
  });
});
