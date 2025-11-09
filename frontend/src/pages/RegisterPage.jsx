import React, { useState, useRef } from 'react';
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
  Checkbox,
  Textarea,
  FormErrorMessage,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, login } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'patient',
    specialization: '',
    experience: '',
    bio: '',
    price: '',
  });
  const [qualificationFile, setQualificationFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const validateFile = file => {
    if (!file) return false;

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
    ];
    if (!allowedTypes.includes(file.type)) {
      setError(
        'Неправильний тип файлу. Дозволені тільки PDF та зображення (JPEG, PNG, GIF)'
      );
      return false;
    }
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Розмір файлу не повинен перевищувати 10MB');
      return false;
    }
    return true;
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      setQualificationFile(file);
      setError('');
    }
  };

  const handleDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      setQualificationFile(file);
      setError('');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const isPasswordShort =
    form.password && form.password.length > 0 && form.password.length < 8;

  const onSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (form.role === 'psychologist') {
        // Use special endpoint for psychologist registration with file upload
        if (!qualificationFile) {
          setError('Потрібно завантажити документ про кваліфікацію');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('qualificationDocument', qualificationFile);
        formData.append('email', form.email);
        formData.append('password', form.password);
        formData.append('firstName', form.firstName);
        formData.append('lastName', form.lastName);
        formData.append('specialization', form.specialization || '');
        formData.append('experience', form.experience || '0');
        formData.append('bio', form.bio || '');
        formData.append('price', form.price || '0');

        const response = await axios.post(
          '/api/auth/register-psychologist',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        const { token: receivedToken, user: receivedUser } =
          response.data || {};
        if (receivedToken && receivedUser) {
          // Update auth context - login will set the token and user
          await login({ email: form.email, password: form.password });
        }

        // Show success message
        if (response.data.message) {
          setError(''); // Clear any errors
          // Show success toast (would need toast context)
          navigate('/profile', {
            state: {
              message:
                'Реєстрацію успішно завершено. Ваш профіль очікує на підтвердження адміністратором.',
            },
          });
        } else {
          navigate('/psychologists');
        }
      } else {
        // Regular patient registration
        await register(form);
        navigate('/psychologists');
      }
    } catch (err) {
      setError(
        err?.response?.data?.msg ||
          err?.response?.data?.error ||
          'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      maxW="560px"
      mx="auto"
      my={{ base: 6, md: 10 }}
      p={{ base: 6, md: 10 }}
      bg="white"
      border="1px"
      borderColor="gray.200"
      rounded="2xl"
      boxShadow="sm"
    >
      <Heading as="h2" size="lg" textAlign="center" mb={2}>
        Реєстрація
      </Heading>
      <Text color="gray.500" textAlign="center" mb={8}>
        Створіть новий обліковий запис
      </Text>

      {error && (
        <Box color="red.500" mb={3}>
          {error}
        </Box>
      )}

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
            _hover={{
              bg: form.role === 'psychologist' ? '#B71C1C' : 'gray.100',
            }}
            flex={1}
          >
            Психолог
          </Button>
        </HStack>
      </Box>

      <VStack as="form" spacing={5} onSubmit={onSubmit} align="stretch">
        <HStack spacing={3}>
          <FormControl isRequired>
            <FormLabel>Ім'я</FormLabel>
            <Input
              name="firstName"
              placeholder="Іван"
              value={form.firstName}
              onChange={onChange}
              size="lg"
              bg="gray.50"
              borderRadius="12px"
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Прізвище</FormLabel>
            <Input
              name="lastName"
              placeholder="Петренко"
              value={form.lastName}
              onChange={onChange}
              size="lg"
              bg="gray.50"
              borderRadius="12px"
            />
          </FormControl>
        </HStack>

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
            borderRadius="12px"
          />
        </FormControl>

        <FormControl isRequired isInvalid={isPasswordShort}>
          <FormLabel>Пароль</FormLabel>
          <Input
            type="password"
            name="password"
            placeholder="••••••••"
            value={form.password}
            onChange={onChange}
            size="lg"
            bg="gray.50"
            borderRadius="12px"
          />
          {!isPasswordShort && (
            <Text color="gray.500" fontSize="sm" mt={1}>
              Мінімум 8 символів
            </Text>
          )}
          {isPasswordShort && (
            <FormErrorMessage>
              Пароль має містити щонайменше 8 символів
            </FormErrorMessage>
          )}
        </FormControl>

        {form.role === 'psychologist' && (
          <>
            <Box mt={8} mb={6}>
              <Heading
                as="h3"
                size="lg"
                color="gray.800"
                fontWeight="semibold"
                mb={4}
              >
                Опишіть свою кваліфікацію та досвід роботи
              </Heading>
            </Box>

            <FormControl>
              <FormLabel>Спеціалізація</FormLabel>
              <Input
                name="specialization"
                placeholder="Діти, підлітки, дорослі"
                value={form.specialization}
                onChange={onChange}
                size="lg"
                bg="gray.50"
                borderRadius="12px"
              />
            </FormControl>
            <HStack spacing={3}>
              <FormControl>
                <FormLabel>Досвід (років)</FormLabel>
                <Input
                  type="number"
                  name="experience"
                  placeholder="5"
                  value={form.experience}
                  onChange={onChange}
                  size="lg"
                  bg="gray.50"
                  borderRadius="12px"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Ціна за сесію (₴)</FormLabel>
                <Input
                  type="number"
                  name="price"
                  placeholder="1000"
                  value={form.price}
                  onChange={onChange}
                  size="lg"
                  bg="gray.50"
                  borderRadius="12px"
                />
              </FormControl>
            </HStack>
            <FormControl>
              <FormLabel>Про себе</FormLabel>
              <Textarea
                name="bio"
                placeholder="Розкажіть про свій досвід..."
                value={form.bio}
                onChange={onChange}
                size="lg"
                bg="gray.50"
                borderRadius="12px"
                rows={3}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontWeight="semibold" color="gray.800" mb={2}>
                Документ про кваліфікацію{' '}
                <Text as="span" color="red.500">
                  *
                </Text>
              </FormLabel>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,application/pdf,image/jpeg,image/png,image/gif"
                onChange={handleFileChange}
                display="none"
              />
              <Box
                border="2px dashed"
                borderColor={isDragging ? '#D32F2F' : 'gray.300'}
                borderRadius="12px"
                p={10}
                textAlign="center"
                cursor="pointer"
                bg={isDragging ? 'red.50' : 'white'}
                transition="all 0.2s"
                minH="160px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                _hover={{
                  borderColor: '#D32F2F',
                  bg: 'gray.50',
                }}
                onClick={handleUploadClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <VStack spacing={4}>
                  <Box
                    width="64px"
                    height="64px"
                    color={isDragging ? '#D32F2F' : 'gray.400'}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    transition="color 0.2s"
                  >
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </Box>
                  <VStack spacing={1}>
                    <Text
                      color="#D32F2F"
                      fontWeight="medium"
                      fontSize="md"
                      cursor="pointer"
                    >
                      Натисніть для завантаження
                    </Text>
                    <Text color="gray.500" fontSize="sm">
                      або перетягніть файл сюди
                    </Text>
                  </VStack>
                </VStack>
              </Box>
              <Text color="gray.500" fontSize="sm" mt={2}>
                Завантажте документ, що підтверджує вашу кваліфікацію (PDF або
                зображення, максимум 10MB)
              </Text>
              {qualificationFile && (
                <Box
                  mt={2}
                  p={2}
                  bg="green.50"
                  borderRadius="8px"
                  border="1px solid"
                  borderColor="green.200"
                >
                  <Text color="green.700" fontSize="sm" fontWeight="medium">
                    Файл вибрано: {qualificationFile.name}
                  </Text>
                </Box>
              )}
            </FormControl>
          </>
        )}

        <HStack align="start">
          <Checkbox
            isChecked={agreed}
            onChange={e => setAgreed(e.target.checked)}
          />
          <Text color="gray.600" fontSize="sm">
            Я погоджуюся з{' '}
            <Link
              color="red.500"
              onClick={e => {
                e.preventDefault();
                onOpen();
              }}
              textDecoration="underline"
            >
              політикою конфіденційності
            </Link>{' '}
            та умовами використання (GDPR)
          </Text>
        </HStack>

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Політика конфіденційності</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <Text mb={4}>
                Ми збираємо та обробляємо ваші персональні дані відповідно до
                GDPR та українського законодавства.
              </Text>
              <Text mb={4}>
                Ваші дані використовуються виключно для надання послуг платформи
                MindCare та не передаються третім особам без вашої згоди.
              </Text>
              <Text>
                Ви маєте право на доступ, виправлення та видалення своїх
                персональних даних у будь-який час.
              </Text>
            </ModalBody>
          </ModalContent>
        </Modal>

        <Button
          type="submit"
          size="lg"
          h="52px"
          borderRadius="12px"
          bg="#D32F2F"
          _hover={{ bg: '#B71C1C' }}
          color="white"
          isDisabled={!agreed || isPasswordShort}
          isLoading={loading}
          loadingText="Створюємо..."
        >
          Створити Акаунт
        </Button>
      </VStack>

      <Text textAlign="center" mt={6} color="gray.600">
        Вже маєте акаунт?{' '}
        <Link as={RouterLink} to="/login" color="red.500">
          Увійти
        </Link>
      </Text>
    </Box>
  );
};

export default RegisterPage;
