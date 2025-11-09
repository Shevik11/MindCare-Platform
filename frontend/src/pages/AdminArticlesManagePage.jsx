import React, { useState, useEffect } from 'react';
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
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Flex,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@chakra-ui/react';
import getImageUrl from '../utils/imageUrl';

const AdminArticlesManagePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [statusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [processingIds, setProcessingIds] = useState(new Set());

  useEffect(() => {
    loadArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page, searchQuery]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: '20',
      });
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      const res = await axios.get(`/api/admin/articles/all?${params}`);
      setArticles(res.data.articles);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Failed to load articles:', err);
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
        navigate('/');
      } else if (err.response?.status === 404) {
        toast({
          title: `Маршрут не знайдено. Перевірте, чи сервер запущений. Помилка: ${err.response?.data?.error || err.message}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top',
          render: ({ onClose }) => (
            <CustomToast
              title={`Маршрут не знайдено. Перевірте, чи сервер запущений. Помилка: ${err.response?.data?.error || err.message}`}
              onClose={onClose}
              status="error"
            />
          ),
        });
      } else {
        toast({
          title: `Не вдалося завантажити статті: ${err.response?.data?.error || err.message}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top',
          render: ({ onClose }) => (
            <CustomToast
              title={`Не вдалося завантажити статті: ${err.response?.data?.error || err.message}`}
              onClose={onClose}
              status="error"
            />
          ),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedArticle) return;

    try {
      setProcessingIds(prev => new Set(prev).add(selectedArticle.id));
      await axios.delete(`/api/admin/articles/${selectedArticle.id}`);
      toast({
        title: 'Статтю успішно видалено',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title="Статтю успішно видалено"
            onClose={onClose}
            status="success"
          />
        ),
      });
      onClose();
      loadArticles();
    } catch (err) {
      console.error('Failed to delete article:', err);
      toast({
        title: err.response?.data?.error || 'Не вдалося видалити статтю',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title={err.response?.data?.error || 'Не вдалося видалити статтю'}
            onClose={onClose}
            status="error"
          />
        ),
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedArticle.id);
        return newSet;
      });
    }
  };

  const getStatusLabel = status => {
    switch (status) {
      case 'draft':
        return 'Чернетка';
      case 'pending':
        return 'На модерації';
      case 'published':
        return 'Опубліковано';
      default:
        return status;
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'draft':
        return 'gray';
      case 'pending':
        return 'orange';
      case 'published':
        return 'green';
      default:
        return 'gray';
    }
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
            Назад до адмін панелі
          </Button>

          <Flex
            direction={{ base: 'column', md: 'row' }}
            align={{ base: 'flex-start', md: 'center' }}
            justify="space-between"
            gap={4}
          >
            <Box>
              <Heading as="h1" size="2xl" color="gray.800" mb={2}>
                Управління статтями
              </Heading>
              <Text color="gray.600" fontSize="lg">
                Переглядайте, редагуйте та видаляйте статті на платформі
              </Text>
            </Box>

            <Button
              onClick={() => navigate('/articles/new')}
              bg="#D32F2F"
              color="white"
              _hover={{ bg: '#B71C1C' }}
              size="lg"
              borderRadius="12px"
              leftIcon={
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
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              }
            >
              Додати статтю
            </Button>
          </Flex>
        </Box>

        {/* Search */}
        <Card rounded="xl" boxShadow="sm" bg="white" mb={6} p={4}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                color="gray.400"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </InputLeftElement>
            <Input
              placeholder="Пошук статей за назвою, описом або автором..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              size="lg"
              bg="white"
              border="1px"
              borderColor="gray.300"
              borderRadius="12px"
              pl={10}
            />
          </InputGroup>
        </Card>

        {/* Articles List */}
        <VStack spacing={4} align="stretch">
          {articles.length === 0 ? (
            <Card rounded="xl" boxShadow="sm" bg="white" p={12}>
              <Box textAlign="center">
                <Text color="gray.500" fontSize="lg">
                  {searchQuery ? 'Статті не знайдено' : 'Немає статей'}
                </Text>
              </Box>
            </Card>
          ) : (
            articles.map(article => {
              const author = article.Users
                ? `${article.Users.firstName || ''} ${article.Users.lastName || ''}`.trim() ||
                  article.Users.email
                : 'Невідомий автор';
              const isProcessing = processingIds.has(article.id);

              return (
                <Card
                  key={article.id}
                  rounded="xl"
                  boxShadow="sm"
                  bg="white"
                  _hover={{ boxShadow: 'lg' }}
                  transition="all 0.2s"
                >
                  <CardBody p={6}>
                    <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
                      {/* Image */}
                      <Box
                        w={{ base: '100%', md: '192px' }}
                        h="128px"
                        flexShrink={0}
                        borderRadius="lg"
                        overflow="hidden"
                        bg="gray.100"
                      >
                        {article.image ? (
                          <Image
                            src={getImageUrl(article.image)}
                            alt={article.title}
                            w="100%"
                            h="100%"
                            objectFit="cover"
                          />
                        ) : (
                          <Box
                            w="100%"
                            h="100%"
                            bg="gray.200"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text color="gray.400" fontSize="sm">
                              Немає зображення
                            </Text>
                          </Box>
                        )}
                      </Box>

                      {/* Content */}
                      <Box flex="1" minW={0}>
                        <Flex
                          align="flex-start"
                          justify="space-between"
                          gap={4}
                          mb={2}
                          direction={{ base: 'column', sm: 'row' }}
                        >
                          <Box flex="1" minW={0}>
                            <Heading
                              as="h3"
                              size="md"
                              color="gray.800"
                              mb={1}
                              noOfLines={1}
                            >
                              {article.title}
                            </Heading>
                            <Text
                              fontSize="sm"
                              color="gray.600"
                              noOfLines={2}
                              lineHeight="1.5"
                            >
                              {article.description || 'Немає опису'}
                            </Text>
                          </Box>

                          <Badge
                            colorScheme={getStatusColor(article.status)}
                            fontSize="sm"
                            px={3}
                            py={1}
                            borderRadius="full"
                            whiteSpace="nowrap"
                          >
                            {getStatusLabel(article.status)}
                          </Badge>
                        </Flex>

                        {/* Metadata */}
                        <HStack
                          spacing={4}
                          fontSize="sm"
                          color="gray.500"
                          mb={4}
                          flexWrap="wrap"
                        >
                          <Text>{author}</Text>
                          <Text>•</Text>
                          <Text>{formatDate(article.createdAt)}</Text>
                          {article.readTime && (
                            <>
                              <Text>•</Text>
                              <Text>{article.readTime} читання</Text>
                            </>
                          )}
                        </HStack>

                        {/* Actions */}
                        <HStack spacing={2} flexWrap="wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/article/${article.id}`)}
                            borderRadius="8px"
                            borderColor="gray.300"
                            color="gray.700"
                            _hover={{ bg: 'gray.50', color: 'gray.800' }}
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
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            }
                          >
                            Переглянути
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(`/articles/${article.id}/edit`)
                            }
                            borderRadius="8px"
                            borderColor="gray.300"
                            color="gray.700"
                            _hover={{ bg: 'gray.50', color: 'gray.800' }}
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
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            }
                          >
                            Редагувати
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedArticle(article);
                              onOpen();
                            }}
                            borderRadius="8px"
                            borderColor="#D32F2F"
                            color="#D32F2F"
                            _hover={{ bg: '#D32F2F', color: 'white' }}
                            isLoading={isProcessing}
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
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            }
                          >
                            Видалити
                          </Button>
                        </HStack>
                      </Box>
                    </Flex>
                  </CardBody>
                </Card>
              );
            })
          )}
        </VStack>

        {/* Summary */}
        {articles.length > 0 && (
          <Box mt={6} textAlign="center">
            <Text color="gray.600" fontSize="sm">
              Показано {articles.length} з {total} статей
            </Text>
          </Box>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box mt={6} textAlign="center">
            <HStack spacing={2} justify="center">
              <Button
                size="sm"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                isDisabled={page === 1}
                borderRadius="8px"
              >
                Попередня
              </Button>
              <Text fontSize="sm" color="gray.600">
                Сторінка {page} з {totalPages}
              </Text>
              <Button
                size="sm"
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                isDisabled={page === totalPages}
                borderRadius="8px"
              >
                Наступна
              </Button>
            </HStack>
          </Box>
        )}
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Видалити статтю</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Ви впевнені, що хочете видалити статтю "{selectedArticle?.title}"?
              Цю дію неможливо скасувати.
            </Text>
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
              bg="red.500"
              color="white"
              _hover={{ bg: 'red.600' }}
              onClick={handleDelete}
              isLoading={processingIds.has(selectedArticle?.id)}
              borderRadius="12px"
            >
              Видалити
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminArticlesManagePage;
