import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Divider,
} from '@chakra-ui/react';
import getImageUrl from '../utils/imageUrl';

const PsychologistAppointmentsPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [appointmentsByDate, setAppointmentsByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadAppointments = async () => {
      try {
        const res = await axios.get('/api/appointments/psychologist');
        setAppointmentsByDate(res.data.appointmentsByDate || {});
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

  // Sort dates - dates are already in format from backend, need to parse properly
  const sortedDates = Object.keys(appointmentsByDate).sort((a, b) => {
    // Parse Ukrainian date format (DD.MM.YYYY) or use appointment datetime
    try {
      const dateA = appointmentsByDate[a][0]?.appointmentDateTime
        ? new Date(appointmentsByDate[a][0].appointmentDateTime)
        : new Date(a.split('.').reverse().join('-'));
      const dateB = appointmentsByDate[b][0]?.appointmentDateTime
        ? new Date(appointmentsByDate[b][0].appointmentDateTime)
        : new Date(b.split('.').reverse().join('-'));
      return dateA - dateB;
    } catch {
      // Fallback to string comparison
      return a.localeCompare(b);
    }
  });

  return (
    <Box bg="gray.50" minH="100vh" py={8}>
      <Container maxW="900px">
        <Heading mb={8}>Записи пацієнтів</Heading>

        {Object.keys(appointmentsByDate).length === 0 ? (
          <Card rounded="2xl" boxShadow="sm">
            <CardBody textAlign="center" py={12}>
              <Text color="gray.600" fontSize="lg">
                Немає записів на сеанси
              </Text>
            </CardBody>
          </Card>
        ) : (
          <VStack align="stretch" spacing={6}>
            {sortedDates.map(dateKey => {
              const dateAppointments = appointmentsByDate[dateKey];
              if (!dateAppointments || dateAppointments.length === 0) {
                return null;
              }
              const firstAppointment = dateAppointments[0];
              const { date } = formatDateTime(
                firstAppointment.appointmentDateTime
              );

              return (
                <Card key={dateKey} rounded="2xl" boxShadow="sm">
                  <CardBody>
                    <Heading size="md" mb={4} color="gray.800">
                      {date}
                    </Heading>
                    <Divider mb={4} />
                    <VStack align="stretch" spacing={3}>
                      {dateAppointments
                        .sort(
                          (a, b) =>
                            new Date(a.appointmentDateTime) -
                            new Date(b.appointmentDateTime)
                        )
                        .map(appointment => {
                          const { time } = formatDateTime(
                            appointment.appointmentDateTime
                          );
                          const patientName = appointment.patient
                            ? `${appointment.patient.firstName || ''} ${appointment.patient.lastName || ''}`.trim()
                            : 'Пацієнт';

                          return (
                            <Box
                              key={appointment.id}
                              p={4}
                              bg="gray.50"
                              borderRadius="12px"
                              borderLeft="4px solid"
                              borderColor="red.500"
                            >
                              <HStack
                                justify="space-between"
                                align="flex-start"
                              >
                                <HStack spacing={4} flex={1}>
                                  <Text
                                    fontWeight="bold"
                                    color="red.500"
                                    fontSize="lg"
                                    minW="80px"
                                  >
                                    {time}
                                  </Text>
                                  <HStack spacing={3}>
                                    <Avatar
                                      size="sm"
                                      src={
                                        appointment.patient?.photoUrl
                                          ? getImageUrl(
                                              appointment.patient.photoUrl
                                            )
                                          : null
                                      }
                                    />
                                    <VStack align="flex-start" spacing={0}>
                                      <Text fontWeight="semibold">
                                        {patientName}
                                      </Text>
                                      {appointment.patient?.email && (
                                        <Text fontSize="sm" color="gray.600">
                                          {appointment.patient.email}
                                        </Text>
                                      )}
                                    </VStack>
                                  </HStack>
                                </HStack>
                                {getStatusBadge(appointment.status)}
                              </HStack>
                            </Box>
                          );
                        })}
                    </VStack>
                  </CardBody>
                </Card>
              );
            })}
          </VStack>
        )}
      </Container>
    </Box>
  );
};

export default PsychologistAppointmentsPage;
