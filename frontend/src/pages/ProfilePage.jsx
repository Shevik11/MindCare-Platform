import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Heading,
  Button,
  Input,
  FormControl,
  FormLabel,
  VStack,
  HStack,
  Card,
  CardBody,
  Container,
  Avatar,
} from '@chakra-ui/react';

const ProfilePage = () => {
  const { user } = useAuth();
  const [me, setMe] = useState(user);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const [psychProfile, setPsychProfile] = useState({
    specialization: '',
    experience: 0,
    bio: '',
    price: '',
  });

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axios.get('/api/auth/me');
        setMe(res.data);
        setUserProfile({
          firstName: res.data.firstName || '',
          lastName: res.data.lastName || '',
          email: res.data.email || '',
        });
        if (res.data.psychologist) {
          setPsychProfile({
            specialization: res.data.psychologist.specialization || '',
            experience: res.data.psychologist.experience || 0,
            bio: res.data.psychologist.bio || '',
            price: res.data.psychologist.price || '',
          });
        }
      } catch (e) {
        console.error('Failed to fetch profile:', e);
      }
    };
    fetchMe();
  }, []);

  const onChangeUser = e => {
    const { name, value } = e.target;
    setUserProfile(p => ({ ...p, [name]: value }));
  };

  const onChangePsych = e => {
    const { name, value } = e.target;
    setPsychProfile(p => ({ ...p, [name]: value }));
  };

  const handlePhotoUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await axios.post('/api/auth/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMe({ ...me, photoUrl: res.data.photoUrl });
      setMessage('Фото оновлено');
    } catch (err) {
      setError('Не вдалося завантажити фото');
    } finally {
      setUploading(false);
    }
  };

  const onSubmitUser = async e => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await axios.put('/api/psychologists/profile', userProfile);
      setMessage('Профіль оновлено');
      await axios.get('/api/auth/me').then(res => setMe(res.data));
    } catch (err) {
      setError(err?.response?.data?.msg || 'Не вдалося оновити');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitPsych = async e => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await axios.put('/api/psychologists/profile', psychProfile);
      setMessage('Профіль психолога оновлено');
    } catch (err) {
      setError(err?.response?.data?.msg || 'Не вдалося оновити');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box bg="gray.50" minH="100vh" py={8}>
      <Container maxW="900px">
        <Heading mb={8}>Мій профіль</Heading>

        {message && (
          <Box color="green.500" mb={4}>
            {message}
          </Box>
        )}
        {error && (
          <Box color="red.500" mb={4}>
            {error}
          </Box>
        )}

        <Card mb={6} rounded="2xl" boxShadow="sm">
          <CardBody>
            <Heading size="md" mb={6}>
              Особисті дані
            </Heading>
            <VStack spacing={6} align="stretch">
              <Box
                textAlign="center"
                position="relative"
                display="inline-block"
                alignSelf="center"
              >
                <Avatar
                  size="2xl"
                  src={
                    me?.photoUrl ? `http://localhost:5000${me.photoUrl}` : null
                  }
                  mb={3}
                />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  display="none"
                  id="photo-upload"
                />
                <Box position="absolute" bottom="8px" right="8px">
                  <Button
                    as="label"
                    htmlFor="photo-upload"
                    size="sm"
                    borderRadius="full"
                    bg="red.500"
                    color="white"
                    _hover={{ bg: 'red.600' }}
                    cursor="pointer"
                    isLoading={uploading}
                    loadingText="..."
                    minW="auto"
                    w="40px"
                    h="40px"
                    p={0}
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </Button>
                </Box>
              </Box>

              <form onSubmit={onSubmitUser}>
                <VStack spacing={4} align="stretch">
                  <HStack spacing={4}>
                    <FormControl>
                      <FormLabel>Ім'я</FormLabel>
                      <Input
                        name="firstName"
                        value={userProfile.firstName}
                        onChange={onChangeUser}
                        placeholder="Ваше ім'я"
                        size="lg"
                        bg="gray.50"
                        border="none"
                        borderRadius="12px"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Прізвище</FormLabel>
                      <Input
                        name="lastName"
                        value={userProfile.lastName}
                        onChange={onChangeUser}
                        placeholder="Ваше прізвище"
                        size="lg"
                        bg="gray.50"
                        border="none"
                        borderRadius="12px"
                      />
                    </FormControl>
                  </HStack>

                  <FormControl>
                    <FormLabel>Електронна пошта</FormLabel>
                    <Input
                      name="email"
                      value={userProfile.email}
                      onChange={onChangeUser}
                      placeholder="your@email.com"
                      size="lg"
                      bg="gray.50"
                      border="none"
                      borderRadius="12px"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    size="lg"
                    h="52px"
                    borderRadius="12px"
                    bg="#D32F2F"
                    _hover={{ bg: '#B71C1C' }}
                    color="white"
                    isLoading={loading}
                    loadingText="Зберігаємо..."
                    mt={2}
                    w="auto"
                    alignSelf="flex-start"
                  >
                    Зберегти особисті дані
                  </Button>
                </VStack>
              </form>
            </VStack>
          </CardBody>
        </Card>

        {me?.role === 'psychologist' && (
          <Card mb={6} rounded="2xl" boxShadow="sm">
            <CardBody>
              <Heading size="md" mb={6}>
                Професійна інформація
              </Heading>
              <form onSubmit={onSubmitPsych}>
                <VStack spacing={4} align="stretch">
                  <HStack spacing={4}>
                    <FormControl flex={2}>
                      <FormLabel>Спеціалізація</FormLabel>
                      <Input
                        name="specialization"
                        value={psychProfile.specialization}
                        onChange={onChangePsych}
                        placeholder="Ваша спеціалізація"
                        size="lg"
                        bg="gray.50"
                        border="none"
                        borderRadius="12px"
                      />
                    </FormControl>
                    <FormControl flex={1}>
                      <FormLabel>Роки досвіду</FormLabel>
                      <Input
                        name="experience"
                        type="number"
                        value={psychProfile.experience}
                        onChange={onChangePsych}
                        size="lg"
                        bg="gray.50"
                        border="none"
                        borderRadius="12px"
                      />
                    </FormControl>
                  </HStack>

                  <FormControl>
                    <FormLabel>Про себе</FormLabel>
                    <Input
                      name="bio"
                      value={psychProfile.bio}
                      onChange={onChangePsych}
                      placeholder="Розкажіть про себе"
                      size="lg"
                      bg="gray.50"
                      border="none"
                      borderRadius="12px"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Ціна за сесію (грн)</FormLabel>
                    <Input
                      name="price"
                      type="number"
                      step="0.01"
                      value={psychProfile.price}
                      onChange={onChangePsych}
                      size="lg"
                      bg="gray.50"
                      border="none"
                      borderRadius="12px"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    size="lg"
                    h="52px"
                    borderRadius="12px"
                    bg="#D32F2F"
                    _hover={{ bg: '#B71C1C' }}
                    color="white"
                    isLoading={loading}
                    loadingText="Зберігаємо..."
                    mt={2}
                    w="auto"
                    alignSelf="flex-start"
                  >
                    Зберегти професійні дані
                  </Button>
                </VStack>
              </form>
            </CardBody>
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default ProfilePage;
