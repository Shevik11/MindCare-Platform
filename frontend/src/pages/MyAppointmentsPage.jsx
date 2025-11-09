import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Heading,
  Container,
  Card,
  CardBody,
  VStack,
  HStack,
  Text,
  Badge,
  Avatar,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import getImageUrl from '../utils/imageUrl';

const MyAppointmentsPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState({
    active: [],
    archived: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadAppointments = async () => {
      try {
        const res = await axios.get('/api/appointments/my');
        setAppointments({
          active: res.data.active || [],
          archived: res.data.archived || [],
        });
      } catch (err) {
        console.error('Failed to load appointments:', err);
        if (err.response?.status === 401) {
          // Token expired or invalid, redirect to login
          navigate('/login');
          return;
        }
        setError('Не вдалося завантажити записи');
      } finally {
        setLoading(false);
      }
    };
    loadAppointments();
  }, [isAuthenticated, navigate]);

  const formatDateTime = dateTimeString => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('uk-UA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const getStatusBadge = status => {
    const statusConfig = {
      scheduled: { color: 'green', text: 'Заплановано' },
      completed: { color: 'blue', text: 'Завершено' },
      cancelled: { color: 'red', text: 'Скасовано' },
    };
    const config = statusConfig[status] || statusConfig.scheduled;
    return (
      <Badge colorScheme={config.color} px={3} py={1} borderRadius="full">
        {config.text}
      </Badge>
    );
  };

  const AppointmentCard = ({ appointment }) => {
    const { date, time } = formatDateTime(appointment.appointmentDateTime);
    const psychologistName = appointment.psychologist?.user
      ? `${appointment.psychologist.user.firstName || ''} ${appointment.psychologist.user.lastName || ''}`.trim()
      : 'Психолог';

    return (
      <Card mb={4} rounded="2xl" boxShadow="sm">
        <CardBody>
          <HStack spacing={4} align="flex-start">
            <Avatar
              size="md"
              src={
                appointment.psychologist?.user?.photoUrl
                  ? getImageUrl(appointment.psychologist.user.photoUrl)
                  : null
              }
            />
            <VStack align="flex-start" spacing={2} flex={1}>
              <HStack justify="space-between" w="100%">
                <Heading size="sm">{psychologistName}</Heading>
                {getStatusBadge(appointment.status)}
              </HStack>
              {appointment.psychologist?.specialization && (
                <Text color="gray.600" fontSize="sm">
                  {appointment.psychologist.specialization}
                </Text>
              )}
              <HStack spacing={4} color="gray.600" fontSize="sm">
                <HStack spacing={1}>
                  <Box w={4} h={4}>
                    <svg
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </Box>
                  <Text>{date}</Text>
                </HStack>
                <HStack spacing={1}>
                  <Box w={4} h={4}>
                    <svg
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </Box>
                  <Text>{time}</Text>
                </HStack>
                {appointment.psychologist?.price && (
                  <Text fontWeight="semibold" color="red.500">
                    {appointment.psychologist.price} грн
                  </Text>
                )}
              </HStack>
            </VStack>
            <Button
              as={RouterLink}
              to={`/psychologist/${appointment.psychologist.id}`}
              size="sm"
              variant="outline"
              colorScheme="red"
            >
              Переглянути профіль
            </Button>
          </HStack>
        </CardBody>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box bg="gray.50" minH="100vh" py={8}>
        <Container maxW="900px">
          <Text>Завантаження...</Text>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box bg="gray.50" minH="100vh" py={8}>
        <Container maxW="900px">
          <Text color="red.500">{error}</Text>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg="gray.50" minH="100vh" py={8}>
      <Container maxW="900px">
        <Heading mb={8}>Мої записи</Heading>

        <Tabs colorScheme="red">
          <TabList>
            <Tab>Активні ({appointments.active.length})</Tab>
            <Tab>Архів ({appointments.archived.length})</Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0}>
              {appointments.active.length === 0 ? (
                <Card rounded="2xl" boxShadow="sm">
                  <CardBody textAlign="center" py={12}>
                    <Text color="gray.600" fontSize="lg">
                      Немає активних записів
                    </Text>
                    <Button
                      as={RouterLink}
                      to="/psychologists"
                      mt={4}
                      colorScheme="red"
                    >
                      Знайти психолога
                    </Button>
                  </CardBody>
                </Card>
              ) : (
                <VStack align="stretch" mt={4}>
                  {appointments.active.map(appointment => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))}
                </VStack>
              )}
            </TabPanel>

            <TabPanel px={0}>
              {appointments.archived.length === 0 ? (
                <Card rounded="2xl" boxShadow="sm">
                  <CardBody textAlign="center" py={12}>
                    <Text color="gray.600" fontSize="lg">
                      Немає архівних записів
                    </Text>
                  </CardBody>
                </Card>
              ) : (
                <VStack align="stretch" mt={4}>
                  {appointments.archived.map(appointment => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))}
                </VStack>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Box>
  );
};

export default MyAppointmentsPage;
