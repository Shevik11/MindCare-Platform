import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Heading,
  Text,
  Input,
  FormControl,
  FormLabel,
  Button,
  Link,
  VStack,
  HStack,
  Checkbox
} from '@chakra-ui/react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/psychologists');
    } catch (err) {
      setError(err?.response?.data?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="560px" mx="auto" my={{ base: 6, md: 10 }} p={{ base: 6, md: 10 }} bg="white" border="1px" borderColor="gray.200" rounded="2xl" boxShadow="sm">
      <Heading as="h2" size="lg" textAlign="center" mb={2}>Реєстрація</Heading>
      <Text color="gray.500" textAlign="center" mb={8}>Створіть новий обліковий запис</Text>

      {error && <Box color="red.500" mb={3}>{error}</Box>}

      <Box mb={8}>
        <FormLabel mb={2}>Тип облікового запису</FormLabel>
        <HStack spacing={2} bg="gray.100" p={1.5} rounded="full">
          <Button
            onClick={() => setForm({ ...form, role: 'patient' })}
            h="44px"
            px={4}
            borderRadius="full"
            fontWeight="semibold"
            bg={form.role === 'patient' ? '#D32F2F' : 'white'}
            color={form.role === 'patient' ? 'white' : 'gray.800'}
            borderWidth={form.role === 'patient' ? 0 : 1}
            borderColor="gray.200"
            boxShadow={form.role === 'patient' ? 'sm' : 'none'}
            _hover={{ bg: form.role === 'patient' ? '#B71C1C' : 'gray.100' }}
            flex={1}
          >
            Пацієнт
          </Button>
          <Button
            onClick={() => setForm({ ...form, role: 'psychologist' })}
            h="44px"
            px={4}
            borderRadius="full"
            fontWeight="semibold"
            bg={form.role === 'psychologist' ? '#D32F2F' : 'white'}
            color={form.role === 'psychologist' ? 'white' : 'gray.800'}
            borderWidth={form.role === 'psychologist' ? 0 : 1}
            borderColor="gray.200"
            boxShadow={form.role === 'psychologist' ? 'sm' : 'none'}
            _hover={{ bg: form.role === 'psychologist' ? '#B71C1C' : 'gray.100' }}
            flex={1}
          >
            Психолог
          </Button>
        </HStack>
      </Box>

      <VStack as="form" spacing={5} onSubmit={onSubmit} align="stretch">
        <FormControl isRequired>
          <FormLabel>Повне ім'я</FormLabel>
          <Input name="name" placeholder="Іван Петренко" value={form.name} onChange={onChange} size="lg" bg="gray.50" borderRadius="12px" />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input type="email" name="email" placeholder="your@email.com" value={form.email} onChange={onChange} size="lg" bg="gray.50" borderRadius="12px" />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Пароль</FormLabel>
          <Input type="password" name="password" placeholder="••••••••" value={form.password} onChange={onChange} size="lg" bg="gray.50" borderRadius="12px" />
          <Text color="gray.500" fontSize="sm" mt={1}>Мінімум 8 символів</Text>
        </FormControl>

        <HStack align="start">
          <Checkbox isChecked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <Text color="gray.600" fontSize="sm">
            Я погоджуюся з{' '}
            <Link color="red.500" onClick={(e) => { e.preventDefault(); alert('Політика конфіденційності'); }}>політикою конфіденційності</Link>
            {' '}та умовами використання (GDPR)
          </Text>
        </HStack>

        <Button type="submit" size="lg" h="52px" borderRadius="12px" bg="#D32F2F" _hover={{ bg: '#B71C1C' }} color="white" isDisabled={!agreed} isLoading={loading} loadingText="Створюємо...">
          Створити Акаунт
        </Button>
      </VStack>

      <Text textAlign="center" mt={6} color="gray.600">
        Вже маєте акаунт?{' '}
        <Link as={RouterLink} to="/login" color="red.500">Увійти</Link>
      </Text>
    </Box>
  );
};

export default RegisterPage;


