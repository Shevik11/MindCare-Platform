import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CustomToast from '../components/CustomToast';
import {
  Box,
  Heading,
  Text,
  Container,
  SimpleGrid,
  Card,
  CardBody,
  VStack,
  HStack,
  Spinner,
  useToast,
  Button,
  Input,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';

const AdminPanel = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalPsychologists: 0,
    totalUsers: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/stats');
      setStats(res.data.stats);
      setRecentActivity(res.data.recentActivity || []);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      if (err.response?.status === 403) {
        toast({
          title: 'Тільки адміністратори можуть переглядати цю сторінку',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top',
          render: ({ onClose }) => (
            <CustomToast
              title="Тільки адміністратори можуть переглядати цю сторінку"
              onClose={onClose}
              status="error"
            />
          ),
        });
        navigate('/');
      } else {
        toast({
          title: 'Не вдалося завантажити статистику',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top',
          render: ({ onClose }) => (
            <CustomToast
              title="Не вдалося завантажити статистику"
              onClose={onClose}
              status="error"
            />
          ),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const formatTime = timeString => {
    if (!timeString) return 'Дата невідома';

    try {
      const date = new Date(timeString);

      // Check if date is valid
      if (Number.isNaN(date.getTime())) {
        console.error('Invalid date:', timeString);
        return 'Дата невідома';
      }

      const now = new Date();
      const diffMs = now - date;

      // Check if date is in the future (shouldn't happen, but handle it)
      if (diffMs < 0) {
        return date.toLocaleDateString('uk-UA', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }

      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        return 'щойно';
      } else if (diffMins < 60) {
        const mins = diffMins;
        if (mins === 1) return '1 хвилину тому';
        if (mins < 5) return `${mins} хвилини тому`;
        return `${mins} хвилин тому`;
      } else if (diffHours < 24) {
        const hours = diffHours;
        if (hours === 1) return '1 годину тому';
        if (hours < 5) return `${hours} години тому`;
        return `${hours} годин тому`;
      } else if (diffDays < 7) {
        const days = diffDays;
        if (days === 1) return '1 день тому';
        return `${days} днів тому`;
      } else {
        return date.toLocaleDateString('uk-UA', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    } catch (error) {
      console.error('Error formatting time:', error, timeString);
      return 'Дата невідома';
    }
  };

  const getActivityText = type => {
    switch (type) {
      case 'article_published':
        return 'Нова стаття опублікована';
      case 'article_updated':
        return 'Стаття відредагована';
      case 'psychologist_registered':
        return 'Новий психолог зареєстрований';
      default:
        return 'Активність';
    }
  };

  const handleCreateAdmin = async e => {
    e.preventDefault();
    setCreatingAdmin(true);

    try {
      await axios.post('/api/admin/create-admin', adminForm);
      toast({
        title: `Адмін акаунт для ${adminForm.email} успішно створено`,
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title={`Адмін акаунт для ${adminForm.email} успішно створено`}
            onClose={onClose}
            status="success"
          />
        ),
      });
      setAdminForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
      });
      onClose();
      // Reload stats to update user count
      loadStats();
    } catch (err) {
      console.error('Failed to create admin:', err);
      toast({
        title: err.response?.data?.error || 'Не вдалося створити адмін акаунт',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title={
              err.response?.data?.error || 'Не вдалося створити адмін акаунт'
            }
            onClose={onClose}
            status="error"
          />
        ),
      });
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleAdminFormChange = e => {
    const { name, value } = e.target;
    setAdminForm(prev => ({ ...prev, [name]: value }));
  };

  const quickActions = [
    {
      title: 'Модерація',
      description:
        'Перевірити та схвалити статті та профілі психологів, які очікують на публікацію',
      action: () => navigate('/admin/moderation'),
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      title: 'Управління статтями',
      description: 'Переглянути, редагувати та видаляти всі статті',
      action: () => navigate('/admin/articles/manage'),
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3" />
        </svg>
      ),
    },
    {
      title: 'Управління психологами',
      description: 'Переглянути та керувати профілями психологів',
      action: () => navigate('/admin/psychologists'),
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ];

  const statsData = [
    {
      label: 'Всього статей',
      value: stats.totalArticles.toString(),
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      label: 'Всього психологів',
      value: stats.totalPsychologists.toString(),
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: 'Активних користувачів',
      value: stats.totalUsers.toLocaleString('uk-UA'),
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <Box bg="gray.50" minH="100vh" py={12}>
        <Container maxW="1200px">
          <Box textAlign="center">
            <Spinner size="xl" color="#D32F2F" />
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg="gray.50" minH="100vh" py={12}>
      <Container maxW="1200px">
        {/* Header */}
        <Box mb={12}>
          <Heading as="h1" size="2xl" color="gray.800" mb={2}>
            Адміністративна панель
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Керуйте контентом та налаштуваннями платформи MindCare
          </Text>
        </Box>

        {/* Stats */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={12}>
          {statsData.map((stat, index) => (
            <Card key={index} rounded="xl" boxShadow="sm" bg="white">
              <CardBody p={6}>
                <HStack justify="space-between" align="flex-start">
                  <Box>
                    <Text color="gray.600" fontSize="sm" mb={1}>
                      {stat.label}
                    </Text>
                    <Heading as="h2" size="xl" color="gray.800">
                      {stat.value}
                    </Heading>
                  </Box>
                  <Box
                    color="#D32F2F"
                    bg="gray.50"
                    p={4}
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {stat.icon}
                  </Box>
                </HStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>

        {/* Quick Actions */}
        <Box mb={8}>
          <Heading as="h2" size="lg" color="gray.800" mb={6}>
            Швидкі дії
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {quickActions.map((action, index) => (
              <Card
                key={index}
                rounded="xl"
                boxShadow="sm"
                bg="white"
                cursor="pointer"
                onClick={action.action}
                _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
              >
                <CardBody p={6}>
                  <HStack align="flex-start" spacing={4}>
                    <Box
                      bg="#D32F2F"
                      color="white"
                      p={3}
                      borderRadius="lg"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      _groupHover={{ bg: '#B71C1C' }}
                      transition="background 0.2s"
                    >
                      {action.icon}
                    </Box>
                    <Box flex={1}>
                      <Heading as="h3" size="md" color="gray.800" mb={2}>
                        {action.title}
                      </Heading>
                      <Text color="gray.600" fontSize="sm">
                        {action.description}
                      </Text>
                    </Box>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Box>

        {/* Recent Activity */}
        <Box mb={8}>
          <Heading as="h2" size="lg" color="gray.800" mb={6}>
            Остання активність
          </Heading>
          <Card rounded="xl" boxShadow="sm" bg="white">
            <CardBody p={6}>
              {recentActivity.length === 0 ? (
                <Text color="gray.500" textAlign="center" py={8}>
                  Активність відсутня
                </Text>
              ) : (
                <VStack align="stretch" spacing={0}>
                  {recentActivity.map((activity, index) => (
                    <Box
                      key={index}
                      py={4}
                      borderBottom={
                        index < recentActivity.length - 1 ? '1px' : 'none'
                      }
                      borderColor="gray.200"
                    >
                      <HStack justify="space-between" align="flex-start">
                        <Box>
                          <Text color="gray.800" fontWeight="medium" mb={1}>
                            {getActivityText(activity.type)}
                          </Text>
                          <Text color="gray.600" fontSize="sm">
                            {activity.title}
                            {activity.subtitle && ` • ${activity.subtitle}`}
                          </Text>
                        </Box>
                        <Text
                          color="gray.500"
                          fontSize="sm"
                          whiteSpace="nowrap"
                          ml={4}
                        >
                          {formatTime(activity.time)}
                        </Text>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </CardBody>
          </Card>
        </Box>

        {/* Admin Management */}
        <Box>
          <Heading as="h2" size="lg" color="gray.800" mb={6}>
            Управління адміністраторами
          </Heading>
          <Card rounded="xl" boxShadow="sm" bg="white">
            <CardBody p={6}>
              <VStack align="stretch" spacing={4}>
                <Text color="gray.600">
                  Створюйте нові адміністративні акаунти для керування
                  платформою
                </Text>
                <Button
                  onClick={onOpen}
                  bg="#D32F2F"
                  color="white"
                  _hover={{ bg: '#B71C1C' }}
                  size="lg"
                  borderRadius="12px"
                  maxW="300px"
                >
                  Створити адмін акаунт
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </Box>
      </Container>

      {/* Create Admin Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleCreateAdmin}>
            <ModalHeader>Створити адмін акаунт</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    name="email"
                    value={adminForm.email}
                    onChange={handleAdminFormChange}
                    placeholder="admin@example.com"
                    size="lg"
                    bg="white"
                    border="1px"
                    borderColor="gray.300"
                    borderRadius="12px"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Пароль</FormLabel>
                  <Input
                    type="password"
                    name="password"
                    value={adminForm.password}
                    onChange={handleAdminFormChange}
                    placeholder="Мінімум 8 символів"
                    size="lg"
                    bg="white"
                    border="1px"
                    borderColor="gray.300"
                    borderRadius="12px"
                  />
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Пароль повинен містити мінімум 8 символів
                  </Text>
                </FormControl>

                <HStack spacing={4}>
                  <FormControl>
                    <FormLabel>Ім'я</FormLabel>
                    <Input
                      type="text"
                      name="firstName"
                      value={adminForm.firstName}
                      onChange={handleAdminFormChange}
                      placeholder="Ім'я"
                      size="lg"
                      bg="white"
                      border="1px"
                      borderColor="gray.300"
                      borderRadius="12px"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Прізвище</FormLabel>
                    <Input
                      type="text"
                      name="lastName"
                      value={adminForm.lastName}
                      onChange={handleAdminFormChange}
                      placeholder="Прізвище"
                      size="lg"
                      bg="white"
                      border="1px"
                      borderColor="gray.300"
                      borderRadius="12px"
                    />
                  </FormControl>
                </HStack>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button
                variant="ghost"
                onClick={onClose}
                mr={3}
                borderRadius="12px"
              >
                Скасувати
              </Button>
              <Button
                type="submit"
                bg="#D32F2F"
                color="white"
                _hover={{ bg: '#B71C1C' }}
                isLoading={creatingAdmin}
                loadingText="Створюємо..."
                borderRadius="12px"
              >
                Створити адмін акаунт
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminPanel;
