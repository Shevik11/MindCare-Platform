import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CustomToast from '../components/CustomToast';
import {
  Box,
  Heading,
  Text,
  Container,
  Card,
  CardBody,
  VStack,
  HStack,
  Spinner,
  useToast,
  Button,
  Badge,
  Avatar,
  SimpleGrid,
} from '@chakra-ui/react';
import getImageUrl from '../utils/imageUrl';

const AdminPsychologistsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [psychologists, setPsychologists] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPsychologists = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/psychologists');
      setPsychologists(res.data);
    } catch (err) {
      console.error('Failed to load psychologists:', err);
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
          title: 'Не вдалося завантажити психологів',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top',
          render: ({ onClose }) => (
            <CustomToast
              title="Не вдалося завантажити психологів"
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
    loadPsychologists();
  }, [loadPsychologists]);

  const getRatingStars = rating => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <HStack spacing={0}>
        {Array.from({ length: fullStars }, (_, i) => (
          <Text key={`full-${i}`} color="#D32F2F" fontSize="lg">
            ★
          </Text>
        ))}
        {hasHalfStar && (
          <Text key="half" color="#D32F2F" fontSize="lg">
            ☆
          </Text>
        )}
        {Array.from({ length: emptyStars }, (_, i) => (
          <Text key={`empty-${i}`} color="gray.300" fontSize="lg">
            ★
          </Text>
        ))}
      </HStack>
    );
  };

  if (loading) {
    return (
      <Box bg="gray.50" minH="100vh" py={12}>
        <Container maxW="1400px">
          <Box textAlign="center">
            <Spinner size="xl" color="#D32F2F" />
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg="gray.50" minH="100vh" py={12}>
      <Container maxW="1400px" px={6}>
        {/* Header */}
        <Box mb={8}>
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            mb={4}
            color="gray.600"
            _hover={{ bg: 'gray.100', color: 'gray.800' }}
            leftIcon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            }
          >
            Повернутись до адмін панелі
          </Button>

          <Heading as="h1" size="2xl" color="gray.800" mb={2}>
            Управління психологами
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Переглядайте та керуйте психологами на платформі
          </Text>
        </Box>

        {/* Psychologists Grid */}
        {psychologists.length === 0 ? (
          <Card rounded="xl" boxShadow="sm" bg="white" p={12}>
            <Box textAlign="center">
              <Text color="gray.500" fontSize="lg">
                Немає психологів
              </Text>
            </Box>
          </Card>
        ) : (
          <>
            <Text mb={4} color="gray.600" fontSize="md">
              Знайдено {psychologists.length} психологів
            </Text>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={6}>
              {psychologists.map(psychologist => {
                const name = psychologist.User
                  ? `${psychologist.User.firstName || ''} ${psychologist.User.lastName || ''}`.trim() ||
                    'Психолог'
                  : 'Психолог';
                const photoUrl = psychologist.User?.photoUrl
                  ? getImageUrl(psychologist.User.photoUrl)
                  : null;

                return (
                  <Card
                    key={psychologist.id}
                    rounded="xl"
                    boxShadow="sm"
                    bg="white"
                    _hover={{ boxShadow: 'lg' }}
                    transition="all 0.2s"
                    h="100%"
                    display="flex"
                    flexDirection="column"
                  >
                    <CardBody
                      textAlign="center"
                      p={6}
                      display="flex"
                      flexDirection="column"
                      flex="1"
                    >
                      <Avatar size="xl" src={photoUrl} mb={4} mx="auto" />
                      <HStack justify="center" mb={2} spacing={2}>
                        <Heading as="h3" size="md" color="gray.800">
                          {name}
                        </Heading>
                        {psychologist.User?.role === 'patient' ? (
                          <Badge
                            colorScheme="red"
                            fontSize="xs"
                            px={3}
                            py={1}
                            borderRadius="full"
                          >
                            Заблоковано
                          </Badge>
                        ) : (
                          <Badge
                            colorScheme="green"
                            fontSize="xs"
                            px={3}
                            py={1}
                            borderRadius="full"
                          >
                            Активний
                          </Badge>
                        )}
                      </HStack>
                      <Text color="gray.600" mb={3} fontSize="sm">
                        Досвід: {psychologist.experience || 0} років
                        {psychologist.specialization && (
                          <>
                            {' • '}
                            <Text as="span" color="gray.500">
                              {psychologist.specialization}
                            </Text>
                          </>
                        )}
                      </Text>
                      <VStack spacing={1} mb={4} flex="1">
                        {getRatingStars(psychologist.averageRating || 0)}
                        <Text color="gray.600" fontSize="sm">
                          ({psychologist.averageRating?.toFixed(1) || '0.0'})
                        </Text>
                        {psychologist.totalComments > 0 && (
                          <Text color="gray.500" fontSize="xs">
                            {psychologist.totalComments} відгуків
                          </Text>
                        )}
                        {psychologist.price != null &&
                          Number(psychologist.price) > 0 && (
                            <Text mt={2} fontWeight="semibold" color="gray.700">
                              {Number(psychologist.price)} грн / сесія
                            </Text>
                          )}
                      </VStack>
                      <Button
                        onClick={() =>
                          navigate(`/admin/psychologists/${psychologist.id}`)
                        }
                        bg="#D32F2F"
                        color="white"
                        _hover={{ bg: '#B71C1C' }}
                        size="md"
                        w="full"
                        borderRadius="12px"
                        mt="auto"
                      >
                        Переглянути психолога
                      </Button>
                    </CardBody>
                  </Card>
                );
              })}
            </SimpleGrid>
          </>
        )}
      </Container>
    </Box>
  );
};

export default AdminPsychologistsPage;
