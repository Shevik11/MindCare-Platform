import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Heading,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  VStack,
  HStack,
  Card,
  CardBody,
  Container
} from '@chakra-ui/react';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [me, setMe] = useState(user);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: ''
  });

  const [psychProfile, setPsychProfile] = useState({
    specialization: '',
    experience: 0,
    bio: '',
    price: ''
  });

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axios.get('/api/auth/me');
        setMe(res.data);
        setUserProfile({
          firstName: res.data.firstName || '',
          lastName: res.data.lastName || ''
        });
        if (res.data.psychologist) {
          setPsychProfile({
            specialization: res.data.psychologist.specialization || '',
            experience: res.data.psychologist.experience || 0,
            bio: res.data.psychologist.bio || '',
            price: res.data.psychologist.price || ''
          });
        }
      } catch (e) {
      }
    };
    fetchMe();
  }, []);

  const onChangeUser = (e) => {
    const { name, value } = e.target;
    setUserProfile((p) => ({ ...p, [name]: value }));
  };

  const onChangePsych = (e) => {
    const { name, value } = e.target;
    setPsychProfile((p) => ({ ...p, [name]: value }));
  };

  const onSubmitUser = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await axios.put('/api/psychologists/profile', userProfile);
      setMessage('Профіль оновлено');
    } catch (err) {
      setError(err?.response?.data?.msg || 'Не вдалося оновити');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitPsych = async (e) => {
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
    <Container maxW="800px" py={8}>
      <Heading mb={6}>Мій профіль</Heading>
      
      {message && <Box color="green.500" mb={4}>{message}</Box>}
      {error && <Box color="red.500" mb={4}>{error}</Box>}

      {me && (
        <Card mb={6}>
          <CardBody>
            <Text>Email: {me.email}</Text>
            <Text>Роль: {me.role === 'psychologist' ? 'Психолог' : 'Пацієнт'}</Text>
          </CardBody>
        </Card>
      )}

      <Card mb={6}>
        <CardBody>
          <Heading size="md" mb={4}>Особисті дані</Heading>
          <form onSubmit={onSubmitUser}>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Ім'я</FormLabel>
                <Input
                  name="firstName"
                  value={userProfile.firstName}
                  onChange={onChangeUser}
                  placeholder="Ваше ім'я"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Прізвище</FormLabel>
                <Input
                  name="lastName"
                  value={userProfile.lastName}
                  onChange={onChangeUser}
                  placeholder="Ваше прізвище"
                />
              </FormControl>
              <Button type="submit" colorScheme="red" isLoading={loading} loadingText="Зберігаємо...">
                Зберегти
              </Button>
            </VStack>
          </form>
        </CardBody>
      </Card>

      <Button onClick={logout} mb={6} colorScheme="gray">
        Вийти
      </Button>

      {me?.role === 'psychologist' && (
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Профіль психолога</Heading>
            <form onSubmit={onSubmitPsych}>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Спеціалізація</FormLabel>
                  <Input
                    name="specialization"
                    value={psychProfile.specialization}
                    onChange={onChangePsych}
                    placeholder="Ваша спеціалізація"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Досвід (роки)</FormLabel>
                  <Input
                    name="experience"
                    type="number"
                    value={psychProfile.experience}
                    onChange={onChangePsych}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Про себе</FormLabel>
                  <Input
                    name="bio"
                    value={psychProfile.bio}
                    onChange={onChangePsych}
                    placeholder="Розкажіть про себе"
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
                  />
                </FormControl>
                <Button type="submit" colorScheme="red" isLoading={loading} loadingText="Зберігаємо...">
                  Зберегти
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>
      )}
    </Container>
  );
};

export default ProfilePage;
