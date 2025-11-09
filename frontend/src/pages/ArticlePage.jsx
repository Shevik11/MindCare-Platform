import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import getImageUrl from '../utils/imageUrl';
import CustomToast from '../components/CustomToast';
import {
  Box,
  Heading,
  Text,
  Button,
  Container,
  Image,
  HStack,
  VStack,
  Divider,
  Spinner,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@chakra-ui/react';

const ArticlePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadArticle = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/articles/${id}`);
        setArticle(res.data);
      } catch (err) {
        console.error('Failed to load article:', err);
        if (err.response?.status === 404) {
          setError('Стаття не знайдена');
        } else {
          setError('Не вдалося завантажити статтю');
        }
      } finally {
        setLoading(false);
      }
    };
    loadArticle();
  }, [id]);

  if (loading) {
    return (
      <Container maxW="1200px" py={20} textAlign="center">
        <Spinner size="xl" color="#D32F2F" />
      </Container>
    );
  }

  if (error || !article) {
    return (
      <Container maxW="1200px" py={20} textAlign="center">
        <Heading mb={4}>{error || 'Стаття не знайдена'}</Heading>
        <Button
          onClick={() => navigate('/')}
          bg="#D32F2F"
          _hover={{ bg: '#B71C1C' }}
          color="white"
        >
          Повернутись до статей
        </Button>
      </Container>
    );
  }

  // Format date
  const formatDate = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const articleDate = formatDate(article.createdAt);

  const handleShare = async () => {
    try {
      // Get current page URL
      // eslint-disable-next-line no-restricted-globals
      const currentUrl = window.location.href;

      // Try to use modern Clipboard API
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = currentUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      // Show toast with custom design
      toast({
        title: 'Посилання скопійовано',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title="Посилання скопійовано"
            onClose={onClose}
            status="success"
          />
        ),
      });
    } catch (err) {
      console.error('Failed to copy link:', err);
      toast({
        title: 'Не вдалося скопіювати посилання',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title="Не вдалося скопіювати посилання"
            onClose={onClose}
            status="error"
          />
        ),
      });
    }
  };

  const handleDeleteClick = () => {
    onOpen();
  };

  const handleDelete = async () => {
    if (!article) return;

    try {
      setDeleting(true);
      await axios.delete(`/api/articles/${article.id}`);
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
      // Navigate to my articles page or home
      if (user?.role === 'psychologist' || user?.role === 'admin') {
        navigate('/articles/my');
      } else {
        navigate('/');
      }
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

  // Check if current user is the author of the article
  const isAuthor =
    user && article && (user.id === article.userId || user.role === 'admin');

  return (
    <Box bg="white" minH="100vh">
      {/* Article Header */}
      <Box bg="gray.50" py={8} borderBottom="1px" borderColor="gray.200">
        <Container maxW="1200px">
          <VStack align="stretch" spacing={4} maxW="900px" mx="auto">
            <HStack justify="space-between" align="flex-start" w="100%">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                color="gray.600"
                _hover={{ color: 'gray.800', bg: 'gray.100' }}
              >
                ← Назад до статей
              </Button>
              {isAuthor && (
                <HStack spacing={2}>
                  <Button
                    onClick={() => navigate(`/articles/${article.id}/edit`)}
                    variant="outline"
                    borderColor="gray.300"
                    color="gray.700"
                    _hover={{ bg: 'gray.50' }}
                    size="sm"
                    borderRadius="12px"
                  >
                    Редагувати
                  </Button>
                  <Button
                    onClick={handleDeleteClick}
                    variant="ghost"
                    color="red.500"
                    _hover={{ bg: 'red.50', color: 'red.600' }}
                    size="sm"
                    borderRadius="12px"
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
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    }
                  >
                    Видалити
                  </Button>
                </HStack>
              )}
            </HStack>

            <Heading as="h1" size="2xl" color="gray.800">
              {article.title}
            </Heading>

            <HStack spacing={6} color="gray.600" fontSize="sm">
              {articleDate && <Text>{articleDate}</Text>}
              {articleDate && <Text>•</Text>}
              <Text>{article.readTime || '5 хв'} читання</Text>
              {article.author && (
                <>
                  <Text>•</Text>
                  <Text>{article.author}</Text>
                </>
              )}
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Featured Image */}
      {article.image && (
        <Container maxW="1200px" py={8}>
          <Box maxW="900px" mx="auto">
            <Box
              aspectRatio={16 / 9}
              overflow="hidden"
              rounded="xl"
              boxShadow="lg"
              mb={8}
            >
              <Image
                src={getImageUrl(article.image)}
                alt={article.title}
                w="100%"
                h="100%"
                objectFit="cover"
                fallback={
                  <Box
                    bg="gray.200"
                    w="100%"
                    h="100%"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color="gray.500">Зображення</Text>
                  </Box>
                }
              />
            </Box>
          </Box>
        </Container>
      )}

      {/* Article Content */}
      <Container maxW="1200px" pb={12}>
        <Box maxW="900px" mx="auto">
          {/* Article Description */}
          {article.description && (
            <Box
              mb={8}
              p={6}
              bg="gray.50"
              rounded="lg"
              borderLeft="4px"
              borderColor="#D32F2F"
            >
              <Text color="gray.800" fontSize="lg">
                {article.description}
              </Text>
            </Box>
          )}

          {/* Article Body */}
          {article.content && (
            <Box
              fontSize="lg"
              lineHeight="tall"
              color="gray.700"
              sx={{
                '& h3': {
                  fontSize: 'xl',
                  fontWeight: 'bold',
                  mt: 8,
                  mb: 4,
                  color: 'gray.800',
                },
                '& p': {
                  mb: 6,
                  lineHeight: 'relaxed',
                },
                '& strong': {
                  fontWeight: 'bold',
                  color: 'gray.800',
                },
              }}
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          )}

          {/* Share Section */}
          <Divider my={12} />
          <HStack justify="space-between" align="center">
            <Text color="gray.600">Поділіться цією статтею:</Text>
            <Button
              variant="outline"
              borderColor="#D32F2F"
              color="#D32F2F"
              bg="white"
              borderRadius="full"
              px={4}
              onClick={handleShare}
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
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              }
              _hover={{
                bg: '#D32F2F',
                color: 'white',
              }}
            >
              Поділитись
            </Button>
          </HStack>

          {/* Back to Articles */}
          <Box mt={12} textAlign="center">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              borderColor="gray.300"
              color="gray.600"
              _hover={{ bg: 'gray.50', color: 'gray.800' }}
            >
              ← Повернутись до всіх статей
            </Button>
          </Box>
        </Box>
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Видалити статтю</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Ви впевнені, що хочете видалити статтю &quot;{article?.title}
              &quot;? Цю дію неможливо скасувати.
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

export default ArticlePage;
