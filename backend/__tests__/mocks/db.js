// Mock database models
const mockUser = {
  id: 1,
  email: 'test@example.com',
  password: '$2a$10$hashedpassword',
  role: 'patient',
  firstName: 'Test',
  lastName: 'User',
  photoUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  toJSON: function () {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
      firstName: this.firstName,
      lastName: this.lastName,
      photoUrl: this.photoUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  },
};

const mockPsychologist = {
  id: 1,
  userId: 1,
  specialization: 'Clinical Psychology',
  experience: 5,
  bio: 'Test bio',
  price: 100.0,
  status: 'approved',
  createdAt: new Date(),
  updatedAt: new Date(),
  toJSON: function () {
    return {
      id: this.id,
      userId: this.userId,
      specialization: this.specialization,
      experience: this.experience,
      bio: this.bio,
      price: this.price,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  },
};

const mockComment = {
  id: 1,
  userId: 1,
  psychologistId: 1,
  rating: 5,
  text: 'Great psychologist!',
  createdAt: new Date(),
  updatedAt: new Date(),
  toJSON: function () {
    return {
      id: this.id,
      userId: this.userId,
      psychologistId: this.psychologistId,
      rating: this.rating,
      text: this.text,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  },
};

module.exports = {
  mockUser,
  mockPsychologist,
  mockComment,
};
