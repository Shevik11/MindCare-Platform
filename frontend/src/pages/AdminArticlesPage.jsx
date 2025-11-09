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
  Image,
  Divider,
  SimpleGrid,
} from '@chakra-ui/react';
import getImageUrl from '../utils/imageUrl';

const AdminArticlesPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());

  const loadPendingArticles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/articles/pending');
      setArticles(res.data);
    } catch (err) {
      console.error('Failed to load pending articles:', err);
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
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    loadPendingArticles();
  }, [loadPendingArticles]);

  const handleApprove = async articleId => {
    try {
      setProcessingIds(prev => new Set(prev).add(articleId));
      await axios.post(`/api/admin/articles/${articleId}/approve`);
      toast({
        title: 'Статтю схвалено',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title="Статтю схвалено"
            onClose={onClose}
            status="success"
          />
        ),
      });
      // Remove approved article from list
      setArticles(prev => prev.filter(article => article.id !== articleId));
    } catch (err) {
      console.error('Failed to approve article:', err);
      toast({
        title: err.response?.data?.error || 'Не вдалося схвалити статтю',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title={err.response?.data?.error || 'Не вдалося схвалити статтю'}
            onClose={onClose}
            status="error"
          />
        ),
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(articleId);
        return newSet;
      });
    }
  };

  const handleReject = async articleId => {
    try {
      setProcessingIds(prev => new Set(prev).add(articleId));
      await axios.post(`/api/admin/articles/${articleId}/reject`);
      toast({
        title: 'Статтю відхилено',
        status: 'info',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title="Статтю відхилено"
            onClose={onClose}
            status="info"
          />
        ),
      });
      // Remove rejected article from list
      setArticles(prev => prev.filter(article => article.id !== articleId));
    } catch (err) {
      console.error('Failed to reject article:', err);
      toast({
        title: err.response?.data?.error || 'Не вдалося відхилити статтю',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title={err.response?.data?.error || 'Не вдалося відхилити статтю'}
            onClose={onClose}
            status="error"
          />
        ),
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(articleId);
        return newSet;
      });
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
            Модерація статей
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Перевірте та схваліть статті для публікації
          </Text>
        </Box>

        {articles.length === 0 ? (
          <Card rounded="xl" boxShadow="sm" bg="white">
            <CardBody p={8}>
              <Text color="gray.500" textAlign="center" fontSize="lg">
                Немає статей, які очікують на модерацію
              </Text>
            </CardBody>
          </Card>
        ) : (
          <VStack spacing={6} align="stretch">
            {articles.map(article => {
              const isProcessing = processingIds.has(article.id);
              const author = article.Users
                ? `${article.Users.firstName || ''} ${article.Users.lastName || ''}`.trim() ||
                  article.Users.email
                : 'Невідомий автор';

              return (
                <Card key={article.id} rounded="xl" boxShadow="sm" bg="white">
                  <CardBody p={6}>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                      {/* Article Image */}
                      {article.image && (
                        <Box>
                          <Image
                            src={getImageUrl(article.image)}
                            alt={article.title}
                            borderRadius="lg"
                            objectFit="cover"
                            w="100%"
                            h="200px"
                          />
                        </Box>
                      )}

                      {/* Article Content */}
                      <Box
                        gridColumn={{
                          base: '1',
                          md: article.image ? 'span 2' : 'span 3',
                        }}
                      >
                        <VStack align="stretch" spacing={4}>
                          <Box>
                            <Badge colorScheme="orange" mb={2}>
                              Очікує на модерацію
                            </Badge>
                            <Heading as="h2" size="lg" color="gray.800" mb={2}>
                              {article.title}
                            </Heading>
                            {article.description && (
                              <Text color="gray.600" noOfLines={3}>
                                {article.description}
                              </Text>
                            )}
                          </Box>

                          <Divider />

                          <VStack align="stretch" spacing={2}>
                            <HStack>
                              <Text
                                color="gray.500"
                                fontSize="sm"
                                fontWeight="medium"
                              >
                                Автор:
                              </Text>
                              <Text color="gray.700" fontSize="sm">
                                {author}
                              </Text>
                            </HStack>
                            {article.Users?.email && (
                              <HStack>
                                <Text
                                  color="gray.500"
                                  fontSize="sm"
                                  fontWeight="medium"
                                >
                                  Email:
                                </Text>
                                <Text color="gray.700" fontSize="sm">
                                  {article.Users.email}
                                </Text>
                              </HStack>
                            )}
                            <HStack>
                              <Text
                                color="gray.500"
                                fontSize="sm"
                                fontWeight="medium"
                              >
                                Створено:
                              </Text>
                              <Text color="gray.700" fontSize="sm">
                                {formatDate(article.createdAt)}
                              </Text>
                            </HStack>
                          </VStack>

                          <HStack spacing={3} pt={2}>
                            <Button
                              onClick={() => navigate(`/article/${article.id}`)}
                              variant="outline"
                              size="sm"
                              borderRadius="12px"
                              flex={1}
                            >
                              Переглянути
                            </Button>
                            <Button
                              onClick={() => handleReject(article.id)}
                              variant="outline"
                              colorScheme="red"
                              size="sm"
                              borderRadius="12px"
                              flex={1}
                              isLoading={isProcessing}
                              loadingText="Відхиляємо..."
                            >
                              Відхилити
                            </Button>
                            <Button
                              onClick={() => handleApprove(article.id)}
                              bg="#D32F2F"
                              color="white"
                              _hover={{ bg: '#B71C1C' }}
                              size="sm"
                              borderRadius="12px"
                              flex={1}
                              isLoading={isProcessing}
                              loadingText="Схвалюємо..."
                            >
                              Схвалити
                            </Button>
                          </HStack>
                        </VStack>
                      </Box>
                    </SimpleGrid>
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

export default AdminArticlesPage;
