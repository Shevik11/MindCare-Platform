import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  SimpleGrid,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Flex,
} from '@chakra-ui/react';
import getImageUrl from '../utils/imageUrl';

const MyArticlesPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/articles/user/my');
      setArticles(res.data);
    } catch (err) {
      console.error('Failed to load articles:', err);
      toast({
        title: 'Не вдалося завантажити статті',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title="Не вдалося завантажити статті"
            onClose={onClose}
            status="error"
          />
        ),
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

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

  const getStatusBadgeColor = status => {
    switch (status) {
      case 'draft':
        return { bg: 'gray.500', color: 'white' };
      case 'pending':
        return { bg: 'orange.400', color: 'gray.800' };
      case 'published':
        return { bg: 'green.500', color: 'white' };
      default:
        return { bg: 'gray.500', color: 'white' };
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
    } catch {
      return '';
    }
  };

  // Filter and search articles
  const filteredArticles = useMemo(() => {
    let filtered = articles;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(article => article.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        article =>
          article.title?.toLowerCase().includes(query) ||
          article.description?.toLowerCase().includes(query) ||
          article.author?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [articles, statusFilter, searchQuery]);

  // Count articles by status
  const statusCounts = useMemo(() => {
    return {
      all: articles.length,
      published: articles.filter(a => a.status === 'published').length,
      pending: articles.filter(a => a.status === 'pending').length,
      draft: articles.filter(a => a.status === 'draft').length,
    };
  }, [articles]);

  const handleDeleteClick = article => {
    setSelectedArticle(article);
    onOpen();
  };

  const handleDelete = async () => {
    if (!selectedArticle) return;

    try {
      setDeleting(true);
      await axios.delete(`/api/articles/${selectedArticle.id}`);
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
      setSelectedArticle(null);
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
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box bg="gray.50" minH="100vh" py={12}>
        <Container maxW="1200px" px={6}>
          <VStack spacing={4} align="center" py={20}>
            <Spinner size="xl" color="#D32F2F" />
            <Text color="gray.600">Завантаження статей...</Text>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg="gray.50" minH="100vh" py={12}>
      <Container maxW="1200px" px={6}>
        {/* Header */}
        <Box mb={8}>
          <Flex justify="space-between" align="flex-start" mb={4}>
            <Box>
              <Heading as="h1" size="2xl" color="gray.800" mb={2}>
                Мої статті
              </Heading>
              <Text color="gray.600" fontSize="lg" mb={1}>
                Управління вашими статтями
              </Text>
              <Text color="gray.500" fontSize="sm">
                Знайдено {filteredArticles.length} статей
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

        {/* Search Bar */}
        <Box mb={4}>
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
              placeholder="Пошук статей..."
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
        </Box>

        {/* Filter Tabs */}
        <HStack spacing={2} mb={6} flexWrap="wrap">
          <Button
            onClick={() => setStatusFilter('all')}
            size="md"
            borderRadius="full"
            bg={statusFilter === 'all' ? '#D32F2F' : 'white'}
            color={statusFilter === 'all' ? 'white' : 'gray.700'}
            _hover={{
              bg: statusFilter === 'all' ? '#B71C1C' : 'gray.50',
            }}
            border="1px"
            borderColor={statusFilter === 'all' ? '#D32F2F' : 'gray.300'}
            px={4}
            py={2}
          >
            Всі ({statusCounts.all})
          </Button>
          <Button
            onClick={() => setStatusFilter('published')}
            size="md"
            borderRadius="full"
            bg={statusFilter === 'published' ? '#D32F2F' : 'white'}
            color={statusFilter === 'published' ? 'white' : 'gray.700'}
            _hover={{
              bg: statusFilter === 'published' ? '#B71C1C' : 'gray.50',
            }}
            border="1px"
            borderColor={statusFilter === 'published' ? '#D32F2F' : 'gray.300'}
            px={4}
            py={2}
          >
            Опубліковані ({statusCounts.published})
          </Button>
          <Button
            onClick={() => setStatusFilter('pending')}
            size="md"
            borderRadius="full"
            bg={statusFilter === 'pending' ? '#D32F2F' : 'white'}
            color={statusFilter === 'pending' ? 'white' : 'gray.700'}
            _hover={{
              bg: statusFilter === 'pending' ? '#B71C1C' : 'gray.50',
            }}
            border="1px"
            borderColor={statusFilter === 'pending' ? '#D32F2F' : 'gray.300'}
            px={4}
            py={2}
          >
            На модерації ({statusCounts.pending})
          </Button>
          <Button
            onClick={() => setStatusFilter('draft')}
            size="md"
            borderRadius="full"
            bg={statusFilter === 'draft' ? '#D32F2F' : 'white'}
            color={statusFilter === 'draft' ? 'white' : 'gray.700'}
            _hover={{
              bg: statusFilter === 'draft' ? '#B71C1C' : 'gray.50',
            }}
            border="1px"
            borderColor={statusFilter === 'draft' ? '#D32F2F' : 'gray.300'}
            px={4}
            py={2}
          >
            Чернетки ({statusCounts.draft})
          </Button>
        </HStack>

        {/* Articles Grid */}
        {filteredArticles.length === 0 ? (
          <Card rounded="xl" boxShadow="sm" bg="white" p={12}>
            <VStack spacing={4} align="center">
              <Text color="gray.500" fontSize="lg">
                {articles.length === 0
                  ? 'У вас поки що немає статей'
                  : 'Статті не знайдено'}
              </Text>
              {articles.length === 0 && (
                <Button
                  onClick={() => navigate('/articles/new')}
                  bg="#D32F2F"
                  color="white"
                  _hover={{ bg: '#B71C1C' }}
                  size="md"
                  borderRadius="12px"
                >
                  Створити першу статтю
                </Button>
              )}
            </VStack>
          </Card>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {filteredArticles.map(article => {
              const imageUrl = article.image
                ? getImageUrl(article.image)
                : null;
              const badgeColors = getStatusBadgeColor(article.status);

              return (
                <Card
                  key={article.id}
                  rounded="xl"
                  boxShadow="sm"
                  bg="white"
                  _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                  h="100%"
                  display="flex"
                  flexDirection="column"
                  overflow="hidden"
                >
                  {/* Image with Status Badge */}
                  {imageUrl && (
                    <Box
                      position="relative"
                      h="200px"
                      bg="gray.100"
                      overflow="hidden"
                    >
                      <Image
                        src={imageUrl}
                        alt={article.title}
                        w="100%"
                        h="100%"
                        objectFit="cover"
                      />
                      <Badge
                        position="absolute"
                        top={3}
                        right={3}
                        bg={badgeColors.bg}
                        color={badgeColors.color}
                        fontSize="xs"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontWeight="medium"
                      >
                        {getStatusLabel(article.status)}
                      </Badge>
                    </Box>
                  )}
                  {!imageUrl && (
                    <Box
                      position="relative"
                      h="200px"
                      bg="gray.100"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text color="gray.400">Немає зображення</Text>
                      <Badge
                        position="absolute"
                        top={3}
                        right={3}
                        bg={badgeColors.bg}
                        color={badgeColors.color}
                        fontSize="xs"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontWeight="medium"
                      >
                        {getStatusLabel(article.status)}
                      </Badge>
                    </Box>
                  )}

                  <CardBody
                    p={6}
                    display="flex"
                    flexDirection="column"
                    flex="1"
                  >
                    <VStack align="stretch" spacing={3} flex="1">
                      {/* Title */}
                      <Heading as="h3" size="md" color="gray.800" noOfLines={2}>
                        {article.title}
                      </Heading>

                      {/* Description */}
                      {article.description && (
                        <Text color="gray.600" fontSize="sm" noOfLines={3}>
                          {article.description}
                        </Text>
                      )}

                      {/* Metadata */}
                      <Box>
                        {article.author && (
                          <Text color="gray.500" fontSize="xs" mb={1}>
                            {article.author}
                          </Text>
                        )}
                        {article.createdAt && (
                          <Text color="gray.500" fontSize="xs">
                            {formatDate(article.createdAt)}
                          </Text>
                        )}
                      </Box>
                    </VStack>

                    {/* Action Buttons */}
                    <HStack
                      spacing={2}
                      mt={4}
                      pt={4}
                      borderTop="1px"
                      borderColor="gray.100"
                    >
                      {article.status === 'published' ? (
                        <>
                          <Button
                            onClick={() => navigate(`/article/${article.id}`)}
                            variant="outline"
                            borderColor="gray.300"
                            color="gray.700"
                            bg="white"
                            _hover={{ bg: 'gray.50' }}
                            size="sm"
                            flex="1"
                            borderRadius="8px"
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
                            onClick={() =>
                              navigate(`/articles/${article.id}/edit`)
                            }
                            variant="outline"
                            borderColor="gray.300"
                            color="gray.700"
                            bg="white"
                            _hover={{ bg: 'gray.50' }}
                            size="sm"
                            flex="1"
                            borderRadius="8px"
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
                        </>
                      ) : (
                        <Button
                          onClick={() =>
                            navigate(`/articles/${article.id}/edit`)
                          }
                          variant="outline"
                          borderColor="gray.300"
                          color="gray.700"
                          bg="white"
                          _hover={{ bg: 'gray.50' }}
                          size="sm"
                          flex="1"
                          borderRadius="8px"
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
                      )}
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={
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
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="19" r="1" />
                            </svg>
                          }
                          variant="outline"
                          borderColor="gray.300"
                          color="gray.700"
                          bg="white"
                          _hover={{ bg: 'gray.50' }}
                          size="sm"
                          borderRadius="8px"
                          aria-label="Додаткові дії"
                        />
                        <MenuList>
                          <MenuItem
                            onClick={() => handleDeleteClick(article)}
                            icon={
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
                            _hover={{ bg: 'red.50', color: 'red.600' }}
                          >
                            Видалити
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </HStack>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>
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
              Ви впевнені, що хочете видалити статтю &quot;
              {selectedArticle?.title}&quot;? Цю дію неможливо скасувати.
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
              isLoading={deleting}
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

export default MyArticlesPage;
