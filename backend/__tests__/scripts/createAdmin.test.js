// Test createAdmin script
const bcrypt = require('bcryptjs');

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('../../db/db', () => {
  const mockPrisma = {
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return mockPrisma;
});

// Mock console and process
jest.spyOn(console, 'log').mockImplementation();
jest.spyOn(console, 'error').mockImplementation();

const prisma = require('../../db/db');

describe('createAdmin script', () => {
  let createAdminScript;

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-require the script to get fresh module
    delete require.cache[require.resolve('../../scripts/createAdmin')];
    createAdminScript = require('../../scripts/createAdmin');
  });

  it('should create a new admin user when user does not exist', async () => {
    const email = 'admin@test.com';
    const password = 'password123';
    const firstName = 'Admin';
    const lastName = 'User';

    prisma.users.findUnique.mockResolvedValue(null);
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('hashedPassword');
    prisma.users.create.mockResolvedValue({
      id: 1,
      email,
      password: 'hashedPassword',
      role: 'admin',
      firstName,
      lastName,
    });

    const result = await createAdminScript.createAdmin(
      email,
      password,
      firstName,
      lastName
    );

    expect(result.role).toBe('admin');
    expect(result.email).toBe(email);
    expect(prisma.users.findUnique).toHaveBeenCalledWith({ where: { email } });
    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(bcrypt.hash).toHaveBeenCalledWith(password, 'salt');
    expect(prisma.users.create).toHaveBeenCalledWith({
      data: {
        email,
        password: 'hashedPassword',
        role: 'admin',
        firstName,
        lastName,
      },
    });
  });

  it('should update existing user to admin when user exists', async () => {
    const email = 'user@test.com';
    const password = 'password123';
    const firstName = 'New';
    const lastName = 'Name';

    const existingUser = {
      id: 1,
      email,
      role: 'patient',
      firstName: 'Old',
      lastName: 'Name',
    };

    prisma.users.findUnique.mockResolvedValue(existingUser);
    prisma.users.update.mockResolvedValue({
      ...existingUser,
      role: 'admin',
      firstName,
      lastName,
    });

    const result = await createAdminScript.createAdmin(
      email,
      password,
      firstName,
      lastName
    );

    expect(result.role).toBe('admin');
    expect(result.firstName).toBe(firstName);
    expect(prisma.users.findUnique).toHaveBeenCalledWith({ where: { email } });
    expect(prisma.users.update).toHaveBeenCalledWith({
      where: { email },
      data: {
        role: 'admin',
        firstName,
        lastName,
      },
    });
    expect(prisma.users.create).not.toHaveBeenCalled();
  });

  it('should use existing user name when firstName/lastName not provided', async () => {
    const email = 'user@test.com';
    const password = 'password123';

    const existingUser = {
      id: 1,
      email,
      role: 'patient',
      firstName: 'Existing',
      lastName: 'User',
    };

    prisma.users.findUnique.mockResolvedValue(existingUser);
    prisma.users.update.mockResolvedValue({
      ...existingUser,
      role: 'admin',
    });

    const result = await createAdminScript.createAdmin(email, password);

    expect(result.firstName).toBe(existingUser.firstName);
    expect(result.lastName).toBe(existingUser.lastName);
    expect(prisma.users.update).toHaveBeenCalledWith({
      where: { email },
      data: {
        role: 'admin',
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
      },
    });
  });

  it('should use empty strings for firstName/lastName when creating new user without them', async () => {
    const email = 'admin@test.com';
    const password = 'password123';

    prisma.users.findUnique.mockResolvedValue(null);
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('hashedPassword');
    prisma.users.create.mockResolvedValue({
      id: 1,
      email,
      password: 'hashedPassword',
      role: 'admin',
      firstName: '',
      lastName: '',
    });

    const result = await createAdminScript.createAdmin(email, password);

    expect(result.firstName).toBe('');
    expect(result.lastName).toBe('');
    expect(prisma.users.create).toHaveBeenCalledWith({
      data: {
        email,
        password: 'hashedPassword',
        role: 'admin',
        firstName: '',
        lastName: '',
      },
    });
  });
});
