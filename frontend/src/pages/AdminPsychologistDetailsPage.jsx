import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import getImageUrl from '../utils/imageUrl';

const AdminPsychologistDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [psychologist, setPsychologist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [blocking, setBlocking] = useState(false);
  const [blockDays, setBlockDays] = useState(1);
  const [blockType, setBlockType] = useState('temporary'); // 'temporary' or 'permanent'

  const loadPsychologist = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/psychologists/${id}`);
      setPsychologist(res.data);
    } catch (err) {
      console.error('Failed to load psychologist:', err);
      console.error('Error response:', err.response);
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
        navigate('/admin/psychologists');
      } else if (err.response?.status === 404) {
        toast({
          title: 'Психолога не знайдено',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top',
          render: ({ onClose }) => (
            <CustomToast
              title="Психолога не знайдено"
              onClose={onClose}
              status="error"
            />
          ),
        });
        navigate('/admin/psychologists');
      } else {
        toast({
          title: 'Не вдалося завантажити дані психолога',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top',
          render: ({ onClose }) => (
            <CustomToast
              title="Не вдалося завантажити дані психолога"
              onClose={onClose}
              status="error"
            />
          ),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    loadPsychologist();
  }, [loadPsychologist]);

  const handleBlockTemporary = async () => {
    try {
      setBlocking(true);
      await axios.post(`/api/admin/psychologists/${id}/block-temporary`, {
        days: blockDays,
      });
      toast({
        title: `Психолога заблоковано на ${blockDays} днів`,
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title={`Психолога заблоковано на ${blockDays} днів`}
            onClose={onClose}
            status="success"
          />
        ),
      });
      onClose();
      // Reload psychologist data to get updated role
      await loadPsychologist();
    } catch (err) {
      console.error('Failed to block psychologist:', err);
      toast({
        title: err.response?.data?.error || 'Не вдалося заблокувати психолога',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title={
              err.response?.data?.error || 'Не вдалося заблокувати психолога'
            }
            onClose={onClose}
            status="error"
          />
        ),
      });
    } finally {
      setBlocking(false);
    }
  };

  const handleBlockPermanent = async () => {
    try {
      setBlocking(true);
      await axios.post(`/api/admin/psychologists/${id}/block-permanent`);
      toast({
        title: 'Психолога заблоковано назавжди',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title="Психолога заблоковано назавжди"
            onClose={onClose}
            status="success"
          />
        ),
      });
      onClose();
      // Reload psychologist data to get updated role
      await loadPsychologist();
    } catch (err) {
      console.error('Failed to block psychologist:', err);
      toast({
        title: err.response?.data?.error || 'Не вдалося заблокувати психолога',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title={
              err.response?.data?.error || 'Не вдалося заблокувати психолога'
            }
            onClose={onClose}
            status="error"
          />
        ),
      });
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblock = async () => {
    try {
      setBlocking(true);
      await axios.post(`/api/admin/psychologists/${id}/unblock`);
      toast({
        title: 'Психолога розблоковано',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title="Психолога розблоковано"
            onClose={onClose}
            status="success"
          />
        ),
      });
      // Reload psychologist data to get updated role
      await loadPsychologist();
    } catch (err) {
      console.error('Failed to unblock psychologist:', err);
      toast({
        title: err.response?.data?.error || 'Не вдалося розблокувати психолога',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title={
              err.response?.data?.error || 'Не вдалося розблокувати психолога'
            }
            onClose={onClose}
            status="error"
          />
        ),
      });
    } finally {
      setBlocking(false);
    }
  };

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

  const formatDate = dateString => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return '';
      return date.toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return '';
    }
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

  if (!psychologist) {
    return (
      <Box bg="gray.50" minH="100vh" py={12}>
        <Container maxW="1400px">
          <Text>Психолога не знайдено</Text>
        </Container>
      </Box>
    );
  }

  const name = psychologist.User
    ? `${psychologist.User.firstName || ''} ${psychologist.User.lastName || ''}`.trim() ||
      'Психолог'
    : 'Психолог';
  const photoUrl = psychologist.User?.photoUrl
    ? getImageUrl(psychologist.User.photoUrl)
    : null;
  // Psychologist is blocked only if role is explicitly 'patient'
  // By default (role is 'psychologist', null, or undefined), they are unblocked
  const userRole = psychologist.User?.role;
  const isBlocked = userRole === 'patient';

  return (
    <Box bg="gray.50" minH="100vh" py={12}>
      <Container maxW="1400px" px={6}>
        {/* Header */}
        <Box mb={8}>
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/psychologists')}
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
            Повернутись до списку психологів
          </Button>

          <HStack justify="space-between" align="flex-start" mb={4}>
            <Box>
              <Heading as="h1" size="2xl" color="gray.800" mb={2}>
                {name}
              </Heading>
              <Text color="gray.600" fontSize="lg">
                Детальна інформація про психолога
              </Text>
            </Box>
            {isBlocked ? (
              <Badge
                colorScheme="red"
                fontSize="md"
                px={4}
                py={1.5}
                borderRadius="full"
              >
                Заблоковано
              </Badge>
            ) : (
              <Badge
                colorScheme="green"
                fontSize="md"
                px={4}
                py={1.5}
                borderRadius="full"
              >
                Активний
              </Badge>
            )}
          </HStack>
        </Box>

        <VStack spacing={6} align="stretch">
          {/* Psychologist Info Card */}
          <Card rounded="xl" boxShadow="sm" bg="white">
            <CardBody p={6}>
              <HStack spacing={6} align="flex-start">
                <Avatar size="2xl" src={photoUrl} />
                <VStack align="flex-start" spacing={2} flex="1">
                  <HStack>
                    <Text fontWeight="semibold" color="gray.700">
                      Email:
                    </Text>
                    <Text color="gray.600">
                      {psychologist.User?.email || 'Невідомий'}
                    </Text>
                  </HStack>
                  <HStack>
                    <Text fontWeight="semibold" color="gray.700">
                      Досвід:
                    </Text>
                    <Text color="gray.600">
                      {psychologist.experience || 0} років
                    </Text>
                  </HStack>
                  {psychologist.specialization && (
                    <HStack>
                      <Text fontWeight="semibold" color="gray.700">
                        Спеціалізація:
                      </Text>
                      <Badge colorScheme="purple" borderRadius="full">
                        {psychologist.specialization}
                      </Badge>
                    </HStack>
                  )}
                  {psychologist.price != null &&
                    Number(psychologist.price) > 0 && (
                      <HStack>
                        <Text fontWeight="semibold" color="gray.700">
                          Ціна:
                        </Text>
                        <Text color="gray.600">
                          {Number(psychologist.price)} грн / сесія
                        </Text>
                      </HStack>
                    )}
                  <HStack>
                    <Text fontWeight="semibold" color="gray.700">
                      Середній рейтинг:
                    </Text>
                    {getRatingStars(psychologist.averageRating || 0)}
                    <Text color="gray.600">
                      ({psychologist.averageRating?.toFixed(1) || '0.0'})
                    </Text>
                    <Text color="gray.500" fontSize="sm">
                      ({psychologist.totalComments || 0} відгуків)
                    </Text>
                  </HStack>
                  {psychologist.bio && (
                    <Box>
                      <Text fontWeight="semibold" color="gray.700" mb={1}>
                        Біографія:
                      </Text>
                      <Text color="gray.600">{psychologist.bio}</Text>
                    </Box>
                  )}
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          {/* Actions Card */}
          <Card rounded="xl" boxShadow="sm" bg="white">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4}>
                Дії
              </Heading>
              <HStack spacing={4} flexWrap="wrap">
                <Button
                  onClick={() => navigate(`/psychologist/${id}`)}
                  variant="outline"
                  borderRadius="12px"
                >
                  Детальніша інфа
                </Button>
                {!isBlocked ? (
                  <>
                    <Button
                      onClick={() => {
                        setBlockType('temporary');
                        onOpen();
                      }}
                      colorScheme="orange"
                      borderRadius="12px"
                    >
                      Заблокувати тимчасово
                    </Button>
                    <Button
                      onClick={() => {
                        setBlockType('permanent');
                        onOpen();
                      }}
                      colorScheme="red"
                      borderRadius="12px"
                    >
                      Заблокувати на постійно
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleUnblock}
                    colorScheme="green"
                    borderRadius="12px"
                    isLoading={blocking}
                  >
                    Розблокувати
                  </Button>
                )}
              </HStack>
            </CardBody>
          </Card>

          {/* Comments Card */}
          <Card rounded="xl" boxShadow="sm" bg="white">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4}>
                Коментарі та відгуки ({psychologist.Comments?.length || 0})
              </Heading>
              {!psychologist.Comments || psychologist.Comments.length === 0 ? (
                <Text color="gray.500">Поки що немає коментарів</Text>
              ) : (
                <VStack spacing={4} align="stretch">
                  {psychologist.Comments.map(comment => (
                    <Box key={comment.id} p={4} bg="gray.50" borderRadius="lg">
                      <HStack justify="space-between" mb={2}>
                        <HStack>
                          <Text fontWeight="semibold" color="gray.800">
                            {comment.User
                              ? `${comment.User.firstName || ''} ${comment.User.lastName || ''}`.trim() ||
                                comment.User.email ||
                                'Анонім'
                              : 'Анонім'}
                          </Text>
                          {getRatingStars(comment.rating)}
                        </HStack>
                        {comment.createdAt && (
                          <Text color="gray.500" fontSize="sm">
                            {formatDate(comment.createdAt)}
                          </Text>
                        )}
                      </HStack>
                      <Text color="gray.700">{comment.text}</Text>
                    </Box>
                  ))}
                </VStack>
              )}
            </CardBody>
          </Card>
        </VStack>
      </Container>

      {/* Block Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {blockType === 'temporary'
              ? 'Заблокувати тимчасово'
              : 'Заблокувати на постійно'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {blockType === 'temporary' ? (
              <FormControl>
                <FormLabel>Кількість днів</FormLabel>
                <Input
                  type="number"
                  value={blockDays}
                  onChange={e => {
                    const value = e.target.value;
                    if (value === '') {
                      setBlockDays(1);
                    } else {
                      const numValue = Number.parseInt(value, 10);
                      if (
                        !Number.isNaN(numValue) &&
                        numValue >= 1 &&
                        numValue <= 365
                      ) {
                        setBlockDays(numValue);
                      }
                    }
                  }}
                  min={1}
                  max={365}
                />
                <Text fontSize="sm" color="gray.500" mt={2}>
                  Мінімум 1 день, максимум 365 днів
                </Text>
              </FormControl>
            ) : (
              <Text>
                Ви впевнені, що хочете заблокувати психолога на постійно? Цю дію
                можна буде скасувати.
              </Text>
            )}
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
              bg={blockType === 'temporary' ? 'orange.500' : 'red.500'}
              color="white"
              _hover={{
                bg: blockType === 'temporary' ? 'orange.600' : 'red.600',
              }}
              onClick={
                blockType === 'temporary'
                  ? handleBlockTemporary
                  : handleBlockPermanent
              }
              isLoading={blocking}
              borderRadius="12px"
            >
              {blockType === 'temporary'
                ? 'Заблокувати'
                : 'Заблокувати назавжди'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminPsychologistDetailsPage;
