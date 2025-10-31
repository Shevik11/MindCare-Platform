import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Heading, Text, Input, FormControl, FormLabel, Button, Link, VStack } from '@chakra-ui/react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate('/psychologists');
    } catch (err) {
      setError(err?.response?.data?.msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="560px" mx="auto" my={{ base: 6, md: 10 }} p={{ base: 6, md: 10 }} bg="white" border="1px" borderColor="gray.200" rounded="2xl" boxShadow="sm">
      <Heading as="h2" size="lg" textAlign="center" mb={2}>Вхід</Heading>
      <Text color="gray.500" textAlign="center" mb={8}>Увійдіть до свого облікового запису</Text>

      {error && <Box color="red.500" mb={3}>{error}</Box>}

      <VStack as="form" spacing={5} onSubmit={onSubmit} align="stretch">
        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            name="email"
            placeholder="your@email.com"
            value={form.email}
            onChange={onChange}
            size="lg"
            bg="gray.50"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Пароль</FormLabel>
          <Input
            type="password"
            name="password"
            placeholder="••••••••"
            value={form.password}
            onChange={onChange}
            size="lg"
            bg="gray.50"
          />
        </FormControl>

        <Box>
          <Link as={RouterLink} to="#" color="red.500">Забули пароль?</Link>
        </Box>

        <Button type="submit" size="lg" h="52px" borderRadius="12px" bg="#D32F2F" _hover={{ bg: '#B71C1C' }} color="white" isLoading={loading} loadingText="Входимо...">
          Увійти
        </Button>
      </VStack>

      <Text textAlign="center" mt={6} color="gray.600">
        Немає акаунту?{' '}
        <Link as={RouterLink} to="/register" color="red.500">Зареєструватися</Link>
      </Text>
    </Box>
  );
};

export default LoginPage;

