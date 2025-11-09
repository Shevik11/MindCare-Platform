// Test updatePsychologistRoles script
jest.mock('../../db/db', () => {
  const mockPrisma = {
    psychologists: {
      findMany: jest.fn(),
    },
    users: {
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

describe('updatePsychologistRoles script', () => {
  let updatePsychologistRolesScript;

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-require the script to get fresh module
    delete require.cache[
      require.resolve('../../scripts/updatePsychologistRoles')
    ];
    updatePsychologistRolesScript = require('../../scripts/updatePsychologistRoles');
  });

  it('should update users to psychologist role when role is not psychologist', async () => {
    const psychologists = [
      {
        id: 1,
        Users: {
          id: 1,
          email: 'user1@test.com',
          role: 'patient',
        },
      },
      {
        id: 2,
        Users: {
          id: 2,
          email: 'user2@test.com',
          role: 'admin',
        },
      },
    ];

    prisma.psychologists.findMany.mockResolvedValue(psychologists);
    prisma.users.update.mockResolvedValue({});

    const result =
      await updatePsychologistRolesScript.updatePsychologistRoles();

    expect(result.updated).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.total).toBe(2);
    expect(prisma.users.update).toHaveBeenCalledTimes(2);
    expect(prisma.users.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { role: 'psychologist' },
    });
    expect(prisma.users.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { role: 'psychologist' },
    });
  });

  it('should skip users who already have psychologist role', async () => {
    const psychologists = [
      {
        id: 1,
        Users: {
          id: 1,
          email: 'user1@test.com',
          role: 'psychologist',
        },
      },
      {
        id: 2,
        Users: {
          id: 2,
          email: 'user2@test.com',
          role: 'psychologist',
        },
      },
    ];

    prisma.psychologists.findMany.mockResolvedValue(psychologists);

    const result =
      await updatePsychologistRolesScript.updatePsychologistRoles();

    expect(result.updated).toBe(0);
    expect(result.skipped).toBe(2);
    expect(result.total).toBe(2);
    expect(prisma.users.update).not.toHaveBeenCalled();
  });

  it('should handle mixed roles correctly', async () => {
    const psychologists = [
      {
        id: 1,
        Users: {
          id: 1,
          email: 'user1@test.com',
          role: 'patient',
        },
      },
      {
        id: 2,
        Users: {
          id: 2,
          email: 'user2@test.com',
          role: 'psychologist',
        },
      },
      {
        id: 3,
        Users: {
          id: 3,
          email: 'user3@test.com',
          role: 'admin',
        },
      },
    ];

    prisma.psychologists.findMany.mockResolvedValue(psychologists);
    prisma.users.update.mockResolvedValue({});

    const result =
      await updatePsychologistRolesScript.updatePsychologistRoles();

    expect(result.updated).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.total).toBe(3);
    expect(prisma.users.update).toHaveBeenCalledTimes(2);
  });

  it('should handle psychologists without associated users', async () => {
    const psychologists = [
      {
        id: 1,
        Users: null,
      },
      {
        id: 2,
        Users: {
          id: 2,
          email: 'user2@test.com',
          role: 'patient',
        },
      },
    ];

    prisma.psychologists.findMany.mockResolvedValue(psychologists);
    prisma.users.update.mockResolvedValue({});

    const result =
      await updatePsychologistRolesScript.updatePsychologistRoles();

    expect(result.updated).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.total).toBe(2);
    expect(prisma.users.update).toHaveBeenCalledTimes(1);
    expect(prisma.users.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { role: 'psychologist' },
    });
  });

  it('should return zero counts when no psychologists exist', async () => {
    prisma.psychologists.findMany.mockResolvedValue([]);

    const result =
      await updatePsychologistRolesScript.updatePsychologistRoles();

    expect(result.updated).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.total).toBe(0);
    expect(prisma.users.update).not.toHaveBeenCalled();
  });

  it('should handle database errors', async () => {
    prisma.psychologists.findMany.mockRejectedValue(
      new Error('Database error')
    );

    await expect(
      updatePsychologistRolesScript.updatePsychologistRoles()
    ).rejects.toThrow('Database error');
  });
});
