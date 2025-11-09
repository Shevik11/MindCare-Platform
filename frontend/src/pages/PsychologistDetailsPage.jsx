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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Image,
  useToast,
  SimpleGrid,
  Spinner,
} from '@chakra-ui/react';
import getImageUrl from '../utils/imageUrl';
import CustomToast from '../components/CustomToast';

const PsychologistDetailsPage = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [newComment, setNewComment] = useState({ rating: 5, text: '' });
  const [selectedDocument, setSelectedDocument] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Appointment booking state
  const {
    isOpen: isAppointmentOpen,
    onOpen: onAppointmentOpen,
    onClose: onAppointmentClose,
  } = useDisclosure();
  const [slotsByDate, setSlotsByDate] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingAppointment, setBookingAppointment] = useState(false);

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

  const viewDocument = documentUrl => {
    setSelectedDocument(documentUrl);
    onOpen();
  };

  const handleBookAppointment = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Будь ласка, увійдіть, щоб записатись на сеанс',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title="Будь ласка, увійдіть, щоб записатись на сеанс"
            onClose={onClose}
            status="warning"
          />
        ),
      });
      return;
    }

    if (user?.role !== 'patient') {
      toast({
        title: 'Тільки пацієнти можуть записуватись на сеанси',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title="Тільки пацієнти можуть записуватись на сеанси"
            onClose={onClose}
            status="error"
          />
        ),
      });
      return;
    }

    onAppointmentOpen();
    loadAvailableSlots();
  };

  const loadAvailableSlots = async () => {
    setLoadingSlots(true);
    try {
      const res = await axios.get(`/api/appointments/slots/${id}`);
      setSlotsByDate(res.data.slotsByDate || {});
    } catch (err) {
      console.error('Failed to load slots:', err);
      toast({
        title: 'Не вдалося завантажити доступні слоти',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title="Не вдалося завантажити доступні слоти"
            onClose={onClose}
            status="error"
          />
        ),
      });
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSelectSlot = slot => {
    setSelectedSlot(slot);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) {
      toast({
        title: 'Будь ласка, оберіть час для запису',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title="Будь ласка, оберіть час для запису"
            onClose={onClose}
            status="warning"
          />
        ),
      });
      return;
    }

    setBookingAppointment(true);
    try {
      await axios.post('/api/appointments', {
        psychologistId: id,
        appointmentDateTime: selectedSlot,
      });

      toast({
        title: 'Запис на сеанс успішно створено',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title="Запис на сеанс успішно створено"
            onClose={onClose}
            status="success"
          />
        ),
      });

      onAppointmentClose();
      setSelectedSlot(null);
      // Reload slots to update availability
      loadAvailableSlots();
    } catch (err) {
      console.error('Failed to book appointment:', err);
      const errorMsg =
        err.response?.data?.msg || 'Не вдалося створити запис на сеанс';
      toast({
        title: errorMsg,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast title={errorMsg} onClose={onClose} status="error" />
        ),
      });
    } finally {
      setBookingAppointment(false);
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
                        ? getImageUrl(item.User.photoUrl)
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

            {/* Education & Qualifications */}
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

            {/* Qualification Documents */}
            {item.qualificationDocument && (
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </Box>
                    <Heading size="md">Документи про кваліфікацію</Heading>
                  </HStack>
                  <VStack spacing={3} align="stretch">
                    <Box
                      p={4}
                      border="1px"
                      borderColor="gray.200"
                      borderRadius="12px"
                      bg="gray.50"
                    >
                      <HStack justify="space-between" align="center">
                        <VStack align="flex-start" spacing={1} flex={1}>
                          <HStack>
                            <Box color="gray.600">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                              </svg>
                            </Box>
                            <Text fontWeight="semibold" color="gray.800">
                              Документ про кваліфікацію
                            </Text>
                          </HStack>
                          <Text fontSize="sm" color="gray.600" ml={7}>
                            {item.qualificationDocument.split('/').pop()}
                          </Text>
                        </VStack>
                        <Button
                          size="sm"
                          variant="outline"
                          borderColor="#D32F2F"
                          color="#D32F2F"
                          bg="white"
                          _hover={{ bg: 'red.50' }}
                          onClick={() =>
                            viewDocument(item.qualificationDocument)
                          }
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
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          }
                        >
                          Переглянути
                        </Button>
                      </HStack>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            )}

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
                  onClick={handleBookAppointment}
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
                  Записатись на сеанс
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

        {/* Document Viewer Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Документ про кваліфікацію</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedDocument && (
                <Box>
                  {selectedDocument.endsWith('.pdf') ||
                  selectedDocument.includes('.pdf') ? (
                    <iframe
                      src={getImageUrl(selectedDocument)}
                      width="100%"
                      height="600px"
                      style={{ border: 'none' }}
                      title="Qualification Document"
                    />
                  ) : (
                    <Image
                      src={getImageUrl(selectedDocument)}
                      alt="Qualification Document"
                      maxH="600px"
                      mx="auto"
                    />
                  )}
                </Box>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onClose}>Закрити</Button>
              {selectedDocument && (
                <Button
                  as={Link}
                  href={getImageUrl(selectedDocument)}
                  target="_blank"
                  ml={3}
                  bg="#D32F2F"
                  color="white"
                  _hover={{ bg: '#B71C1C' }}
                >
                  Відкрити в новій вкладці
                </Button>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Appointment Booking Modal */}
        <Modal
          isOpen={isAppointmentOpen}
          onClose={onAppointmentClose}
          size="xl"
          scrollBehavior="inside"
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Записатись на сеанс</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {loadingSlots ? (
                <Box textAlign="center" py={8}>
                  <Spinner size="xl" color="#D32F2F" />
                  <Text mt={4} color="gray.600">
                    Завантаження доступних слотів...
                  </Text>
                </Box>
              ) : Object.keys(slotsByDate).length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Text color="gray.600">
                    На жаль, немає доступних слотів для запису
                  </Text>
                </Box>
              ) : (
                <VStack spacing={6} align="stretch">
                  {Object.entries(slotsByDate)
                    .sort((a, b) => new Date(a[1][0]) - new Date(b[1][0]))
                    .map(([dateKey, dateSlots]) => (
                      <Box key={dateKey}>
                        <Heading size="sm" mb={3} color="gray.700">
                          {new Date(dateSlots[0]).toLocaleDateString('uk-UA', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </Heading>
                        <SimpleGrid columns={3} spacing={3}>
                          {dateSlots.map(slot => {
                            const slotDate = new Date(slot);
                            const isSelected = selectedSlot === slot;
                            return (
                              <Button
                                key={slot}
                                variant={isSelected ? 'solid' : 'outline'}
                                colorScheme={isSelected ? 'red' : 'gray'}
                                size="sm"
                                onClick={() => handleSelectSlot(slot)}
                                bg={isSelected ? '#D32F2F' : 'white'}
                                color={isSelected ? 'white' : 'gray.700'}
                                borderColor={
                                  isSelected ? '#D32F2F' : 'gray.300'
                                }
                                _hover={{
                                  bg: isSelected ? '#B71C1C' : 'gray.50',
                                  borderColor: isSelected
                                    ? '#B71C1C'
                                    : '#D32F2F',
                                }}
                              >
                                {slotDate.toLocaleTimeString('uk-UA', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Button>
                            );
                          })}
                        </SimpleGrid>
                      </Box>
                    ))}
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                variant="ghost"
                onClick={onAppointmentClose}
                mr={3}
                borderRadius="12px"
              >
                Скасувати
              </Button>
              <Button
                bg="#D32F2F"
                color="white"
                _hover={{ bg: '#B71C1C' }}
                onClick={handleConfirmBooking}
                isLoading={bookingAppointment}
                disabled={!selectedSlot || bookingAppointment}
                borderRadius="12px"
              >
                Підтвердити запис
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
};

export default PsychologistDetailsPage;
