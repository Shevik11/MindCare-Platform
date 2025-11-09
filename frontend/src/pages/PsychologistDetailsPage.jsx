import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  HStack,
  VStack,
  Badge,
  Card,
  CardBody,
  Container,
  Stack,
  Divider,
  Link,
  Textarea,
  FormControl,
  FormLabel,
  Avatar,
} from '@chakra-ui/react';

const PsychologistDetailsPage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [newComment, setNewComment] = useState({ rating: 5, text: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`/api/psychologists/${id}`);
        setItem(res.data || null);
      } catch (e) {
        console.error('Failed to load psychologist:', e);
        setError('Не вдалося завантажити профіль');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    const loadComments = async () => {
      try {
        const res = await axios.get(`/api/comments/psychologist/${id}`);
        setComments(res.data || []);
      } catch (e) {
        console.error('Failed to load comments:', e);
      }
    };
    loadComments();
  }, [id]);

  const handleSubmitComment = async e => {
    e.preventDefault();
    if (!isAuthenticated) {
      setCommentError('Будь ласка, увійдіть, щоб залишити коментар');
      return;
    }
    setCommentLoading(true);
    setCommentError('');
    try {
      const res = await axios.post('/api/comments', {
        psychologistId: id,
        rating: Number(newComment.rating),
        text: newComment.text,
      });
      setComments([res.data, ...comments]);
      setNewComment({ rating: 5, text: '' });
    } catch (e) {
      console.error('Failed to submit comment:', e);
      if (e?.response?.status === 401) {
        setCommentError('Сесія закінчилася. Будь ласка, увійдіть знову');
      } else {
        setCommentError('Не вдалося відправити коментар');
      }
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) return <Box p={6}>Завантаження...</Box>;
  if (error)
    return (
      <Box p={6} color="red.500">
        {error}
      </Box>
    );
  if (!item) return <Box p={6}>Профіль не знайдено</Box>;

  const name = item.User
    ? `${item.User.firstName || ''} ${item.User.lastName || ''}`.trim() ||
      'Психолог'
    : 'Психолог';
  const specializations = item.specialization
    ? item.specialization.split(',')
    : [];

  return (
    <Box bg="gray.50" minH="100vh" py={8}>
      <Container maxW="1200px">
        <Link
          as={RouterLink}
          to="/psychologists"
          color="red.500"
          mb={4}
          display="inline-block"
        >
          ← Назад до каталогу
        </Link>

        <Flex direction={{ base: 'column', lg: 'row' }} gap={6}>
          {/* Left Column - Main Content */}
          <Box flex={1}>
            {/* Profile Header */}
            <Card mb={6} rounded="2xl" boxShadow="sm">
              <CardBody>
                <Flex gap={6} direction={{ base: 'column', md: 'row' }}>
                  <Avatar
                    size="2xl"
                    src={
                      item.User?.photoUrl
                        ? `http://localhost:5000${item.User.photoUrl}`
                        : null
                    }
                    mx={{ base: 'auto', md: 0 }}
                  />
                  <VStack
                    align={{ base: 'center', md: 'flex-start' }}
                    spacing={2}
                  >
                    <Heading size="lg">{name}</Heading>
                    <Text color="gray.600" fontWeight="semibold">
                      Клінічний психолог
                    </Text>
                    <HStack spacing={2}>
                      <Text color="red.500">★★★★★</Text>
                      <Text color="gray.600">(5.0)</Text>
                    </HStack>
                    <HStack spacing={2}>
                      <Box w={5} h={5} color="gray.600">
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
                      <Text color="gray.600">
                        {item.experience || 0} років досвіду
                      </Text>
                    </HStack>
                    <HStack
                      spacing={2}
                      flexWrap="wrap"
                      justify={{ base: 'center', md: 'flex-start' }}
                    >
                      {specializations.map((spec, idx) => (
                        <Badge
                          key={idx}
                          colorScheme="gray"
                          px={3}
                          py={1}
                          rounded="full"
                        >
                          {spec.trim()}
                        </Badge>
                      ))}
                    </HStack>
                  </VStack>
                </Flex>
              </CardBody>
            </Card>

            {/* About Me */}
            {item.bio && (
              <Card mb={6} rounded="2xl" boxShadow="sm">
                <CardBody>
                  <HStack spacing={3} mb={4}>
                    <Box w={6} h={6} color="red.500">
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
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </Box>
                    <Heading size="md">Про мене</Heading>
                  </HStack>
                  <Text color="gray.700" lineHeight="tall">
                    {item.bio}
                  </Text>
                </CardBody>
              </Card>
            )}

            {/* Education & Qualifications - Placeholder */}
            <Card mb={6} rounded="2xl" boxShadow="sm">
              <CardBody>
                <HStack spacing={3} mb={4}>
                  <Box w={6} h={6} color="red.500">
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
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </Box>
                  <Heading size="md">Освіта та кваліфікація</Heading>
                </HStack>
                <Stack spacing={3}>
                  <Text color="gray.700">
                    • Магістр психології, Київський національний університет ім.
                    Тараса Шевченка
                  </Text>
                  <Text color="gray.700">
                    • Сертифікат КПТ-терапевта, Інститут когнітивно-поведінкової
                    терапії
                  </Text>
                  <Text color="gray.700">
                    • Курс з травма-орієнтованої терапії
                  </Text>
                </Stack>
              </CardBody>
            </Card>

            {/* Work Methods - Placeholder */}
            <Card mb={6} rounded="2xl" boxShadow="sm">
              <CardBody>
                <Heading size="md" mb={4}>
                  Методи роботи
                </Heading>
                <HStack spacing={3} flexWrap="wrap">
                  <Badge
                    px={4}
                    py={2}
                    rounded="full"
                    bg="red.50"
                    color="red.600"
                    borderWidth={1}
                    borderColor="red.200"
                  >
                    Когнітивно-поведінкова терапія (КПТ)
                  </Badge>
                  <Badge
                    px={4}
                    py={2}
                    rounded="full"
                    bg="red.50"
                    color="red.600"
                    borderWidth={1}
                    borderColor="red.200"
                  >
                    Майндфулнес
                  </Badge>
                  <Badge
                    px={4}
                    py={2}
                    rounded="full"
                    bg="red.50"
                    color="red.600"
                    borderWidth={1}
                    borderColor="red.200"
                  >
                    ЕМДР
                  </Badge>
                  <Badge
                    px={4}
                    py={2}
                    rounded="full"
                    bg="red.50"
                    color="red.600"
                    borderWidth={1}
                    borderColor="red.200"
                  >
                    Гештальт-терапія
                  </Badge>
                </HStack>
              </CardBody>
            </Card>

            {/* Reviews */}
            <Card rounded="2xl" boxShadow="sm">
              <CardBody>
                <Heading size="md" mb={4}>
                  Відгуки та рейтинг
                </Heading>
                {comments.length === 0 ? (
                  <Text color="gray.600">
                    Поки що немає відгуків. Станьте першим!
                  </Text>
                ) : (
                  <Stack spacing={4}>
                    {comments.map(comment => (
                      <Box key={comment.id} p={4} bg="gray.50" rounded="xl">
                        <HStack mb={2} justify="space-between">
                          <HStack>
                            <Text fontWeight="semibold">
                              {comment.User
                                ? `${comment.User.firstName} ${comment.User.lastName}`.trim()
                                : 'Анонім'}
                            </Text>
                            <Text color="red.500">
                              {'★'.repeat(comment.rating)}
                              {'☆'.repeat(5 - comment.rating)}
                            </Text>
                          </HStack>
                          {comment.createdAt && (
                            <Text color="gray.600" fontSize="sm">
                              {new Date(comment.createdAt).toLocaleDateString(
                                'uk-UA'
                              )}
                            </Text>
                          )}
                        </HStack>
                        <Text color="gray.700">{comment.text}</Text>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardBody>
            </Card>
          </Box>

          {/* Right Column - Booking */}
          <Box w={{ base: 'full', lg: '350px' }}>
            <Card rounded="2xl" boxShadow="md" position="sticky" top={24}>
              <CardBody>
                <Heading size="md" mb={6}>
                  Вартість сесії
                </Heading>
                <Text fontSize="3xl" fontWeight="bold" color="red.500" mb={2}>
                  {item.price || 0} грн
                </Text>
                <Text color="gray.600" mb={6}>
                  50 хвилин
                </Text>

                <Button
                  w="full"
                  size="lg"
                  h="48px"
                  borderRadius="12px"
                  bg="#D32F2F"
                  _hover={{ bg: '#B71C1C' }}
                  color="white"
                  mb={6}
                  leftIcon={
                    <Box w={5} h={5}>
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
                  }
                >
                  Забронювати Сесію
                </Button>

                <Divider my={6} />

                <VStack spacing={4} align="stretch">
                  <HStack spacing={3}>
                    <Box w={5} h={5} color="red.500">
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </Box>
                    <Text color="gray.700" fontSize="sm">
                      Перша консультація безкоштовна (15 хв)
                    </Text>
                  </HStack>
                  <HStack spacing={3}>
                    <Box w={5} h={5} color="red.500">
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </Box>
                    <Text color="gray.700" fontSize="sm">
                      Онлайн або офлайн сесії
                    </Text>
                  </HStack>
                  <HStack spacing={3}>
                    <Box w={5} h={5} color="red.500">
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </Box>
                    <Text color="gray.700" fontSize="sm">
                      Гнучкий графік
                    </Text>
                  </HStack>
                  <HStack spacing={3}>
                    <Box w={5} h={5} color="red.500">
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </Box>
                    <Text color="gray.700" fontSize="sm">
                      Конфіденційність гарантована
                    </Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </Box>
        </Flex>

        {/* Comment Form */}
        {isAuthenticated && (
          <Card mt={8} rounded="2xl" boxShadow="sm">
            <CardBody>
              <Heading size="md" mb={6}>
                Залишити відгук
              </Heading>
              {commentError && (
                <Box color="red.500" mb={4}>
                  {commentError}
                </Box>
              )}
              <form onSubmit={handleSubmitComment}>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>Оцінка</FormLabel>
                    <HStack spacing={1}>
                      {[1, 2, 3, 4, 5].map(rating => (
                        <Box
                          key={rating}
                          as="button"
                          type="button"
                          onClick={() =>
                            setNewComment({ ...newComment, rating })
                          }
                          fontSize="3xl"
                          cursor="pointer"
                          transition="all 0.2s"
                          _hover={{ transform: 'scale(1.2)' }}
                        >
                          {rating <= newComment.rating ? '★' : '☆'}
                        </Box>
                      ))}
                    </HStack>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Ваш відгук</FormLabel>
                    <Textarea
                      value={newComment.text}
                      onChange={e =>
                        setNewComment({ ...newComment, text: e.target.value })
                      }
                      placeholder="Розкажіть про ваш досвід роботи з цим психологом..."
                      rows={4}
                      size="lg"
                    />
                  </FormControl>
                  <Button
                    type="submit"
                    size="lg"
                    h="48px"
                    borderRadius="12px"
                    bg="#D32F2F"
                    _hover={{ bg: '#B71C1C' }}
                    color="white"
                    isLoading={commentLoading}
                    loadingText="Відправляємо..."
                    w="auto"
                    alignSelf="flex-start"
                  >
                    Відправити відгук
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

export default PsychologistDetailsPage;
