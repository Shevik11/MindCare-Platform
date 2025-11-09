import React, { useState, useEffect, useCallback } from 'react';
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
  Input,
  Textarea,
  FormControl,
  FormLabel,
  Container,
  HStack,
  VStack,
  Card,
  CardBody,
  SimpleGrid,
  Divider,
  Select,
  Image,
  IconButton,
  useToast,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';

const ArticleEditPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  // Extract id from params, handle both /articles/new and /articles/:id/edit
  const articleId = params.id === 'new' ? null : params.id;
  const isEdit = !!articleId;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    readTime: '5 хв',
    author: '',
    content: '',
    status: 'draft',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [creationDate, setCreationDate] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  const loadArticle = useCallback(async () => {
    try {
      setLoading(true);
      // Request with edit=true to get Markdown version for editing
      const res = await axios.get(`/api/articles/${articleId}?edit=true`);
      const article = res.data;
      // If status is pending and user is psychologist, show it as published in UI
      // (backend will handle the conversion when saving)
      const displayStatus =
        article.status === 'pending' && user?.role === 'psychologist'
          ? 'published'
          : article.status || 'draft';

      setFormData({
        title: article.title || '',
        description: article.description || '',
        image: article.image || '',
        readTime: article.readTime || '5 хв',
        author: article.author || '',
        // Use Markdown if available (for editing), otherwise fallback to content
        content: article.contentMarkdown || article.content || '',
        status: displayStatus,
      });
      setImagePreview(article.image || '');
      if (article.createdAt) {
        const date = new Date(article.createdAt);
        setCreationDate(
          date.toLocaleDateString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        );
      }
    } catch (err) {
      console.error('Failed to load article:', err);
      setError('Не вдалося завантажити статтю');
    } finally {
      setLoading(false);
    }
  }, [articleId, user]);

  useEffect(() => {
    if (isEdit && articleId) {
      loadArticle();
      return;
    }
    // Set default author if user is logged in
    if (user?.firstName && user?.lastName) {
      setFormData(prev => ({
        ...prev,
        author: `л. ${user.firstName} ${user.lastName}`,
      }));
    }
  }, [articleId, user, isEdit, loadArticle]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (name === 'image') {
      setImagePreview(value);
    }
  };

  const handleImageUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Будь ласка, оберіть файл зображення');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Розмір файлу не повинен перевищувати 10MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await axios.post('/api/articles/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFormData(prev => ({
        ...prev,
        image: res.data.imageUrl,
      }));
      setImagePreview(res.data.imageUrl);
    } catch (err) {
      console.error('Failed to upload image:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Не вдалося завантажити зображення');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e, sendForModeration = false) => {
    if (e) {
      e.preventDefault();
    }
    setError('');
    setSaving(true);

    try {
      // Prepare form data with status
      const submitData = { ...formData };

      // Determine status based on action
      if (sendForModeration) {
        // User clicked "Send for moderation" or "Publish" button
        if (user?.role === 'admin') {
          submitData.status = 'published';
        } else {
          // For psychologists, send as 'pending' for moderation
          submitData.status = 'pending';
        }
      } else {
        // User clicked "Save as draft" button
        submitData.status = 'draft';
      }

      let response;
      if (isEdit && articleId) {
        response = await axios.put(`/api/articles/${articleId}`, submitData);
      } else {
        response = await axios.post('/api/articles', submitData);
      }

      // Check if article was sent for moderation
      const savedStatus = response.data.status;
      if (savedStatus === 'pending') {
        // Show success message about moderation
        toast({
          title:
            'Статтю відправлено на модерацію. Адміністратор перевірить статтю перед публікацією',
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top',
          render: ({ onClose }) => (
            <CustomToast
              title="Статтю відправлено на модерацію. Адміністратор перевірить статтю перед публікацією"
              onClose={onClose}
              status="success"
            />
          ),
        });
      } else if (savedStatus === 'published' && user?.role === 'admin') {
        toast({
          title: 'Статтю опубліковано',
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top',
          render: ({ onClose }) => (
            <CustomToast
              title="Статтю опубліковано"
              onClose={onClose}
              status="success"
            />
          ),
        });
      } else {
        toast({
          title: 'Статтю збережено',
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top',
          render: ({ onClose }) => (
            <CustomToast
              title="Статтю збережено"
              onClose={onClose}
              status="success"
            />
          ),
        });
      }

      navigate('/');
    } catch (err) {
      console.error('Failed to save article:', err);
      if (err.response?.status === 403) {
        setError('У вас немає прав для цієї дії');
      } else {
        setError(err.response?.data?.error || 'Не вдалося зберегти статтю');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxW="1200px" py={8}>
        <Text>Завантаження...</Text>
      </Container>
    );
  }

  return (
    <Box bg="gray.50" minH="100vh" py={8}>
      <Container maxW="1200px">
        <Heading mb={6} size="xl">
          {isEdit ? 'Редагувати статтю' : 'Додати статтю'}
        </Heading>

        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
          {/* Left Panel - Form */}
          <Box gridColumn={{ base: '1', lg: 'span 2' }}>
            <Card rounded="xl" boxShadow="sm">
              <CardBody>
                <form onSubmit={handleSubmit}>
                  <VStack spacing={6} align="stretch">
                    {/* Title */}
                    <FormControl isRequired>
                      <FormLabel>Заголовок статті *</FormLabel>
                      <Input
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Наприклад: Як справитись з тривогою"
                        size="lg"
                        bg="white"
                        border="1px"
                        borderColor="gray.300"
                        borderRadius="12px"
                      />
                    </FormControl>

                    {/* Description */}
                    <FormControl isRequired>
                      <FormLabel>Короткий опис *</FormLabel>
                      <Textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Короткий опис статті, який буде відображатися в попередньому перегляді"
                        size="lg"
                        bg="white"
                        border="1px"
                        borderColor="gray.300"
                        borderRadius="12px"
                        rows={3}
                      />
                    </FormControl>

                    {/* Image URL or Upload */}
                    <FormControl isRequired>
                      <FormLabel>Головне зображення *</FormLabel>
                      <VStack spacing={4} align="stretch">
                        <HStack spacing={4}>
                          <Input
                            name="image"
                            value={formData.image}
                            onChange={handleChange}
                            placeholder="https://example.com/image.jpg або завантажте файл"
                            size="lg"
                            bg="white"
                            border="1px"
                            borderColor="gray.300"
                            borderRadius="12px"
                            flex={1}
                          />
                          <Box position="relative">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              display="none"
                              id="article-image-upload"
                              disabled={uploading}
                            />
                            <Button
                              as="label"
                              htmlFor="article-image-upload"
                              size="lg"
                              bg="gray.100"
                              color="gray.700"
                              _hover={{ bg: 'gray.200' }}
                              cursor="pointer"
                              isLoading={uploading}
                              loadingText="Завантаження..."
                              disabled={uploading}
                            >
                              Завантажити
                            </Button>
                          </Box>
                        </HStack>
                        {imagePreview && (
                          <Box
                            mt={2}
                            position="relative"
                            w="100%"
                            maxH="300px"
                            borderRadius="12px"
                            overflow="hidden"
                            border="1px"
                            borderColor="gray.200"
                          >
                            <Image
                              src={getImageUrl(imagePreview)}
                              alt="Прев'ю зображення"
                              w="100%"
                              h="auto"
                              objectFit="contain"
                              maxH="300px"
                              fallback={
                                <Box
                                  bg="gray.200"
                                  w="100%"
                                  h="200px"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                >
                                  <Text color="gray.500">
                                    Помилка завантаження зображення
                                  </Text>
                                </Box>
                              }
                            />
                            <IconButton
                              aria-label="Видалити зображення"
                              icon={
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
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              }
                              position="absolute"
                              top={2}
                              right={2}
                              size="sm"
                              bg="red.500"
                              color="white"
                              _hover={{ bg: 'red.600' }}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, image: '' }));
                                setImagePreview('');
                              }}
                            />
                          </Box>
                        )}
                        <Text fontSize="sm" color="gray.600">
                          Введіть URL зображення або завантажте файл (макс.
                          10MB)
                        </Text>
                      </VStack>
                    </FormControl>

                    {/* Read Time and Author */}
                    <HStack spacing={4}>
                      <FormControl isRequired flex={1}>
                        <FormLabel>Час читання *</FormLabel>
                        <Input
                          name="readTime"
                          value={formData.readTime}
                          onChange={handleChange}
                          placeholder="5 хв"
                          size="lg"
                          bg="white"
                          border="1px"
                          borderColor="gray.300"
                          borderRadius="12px"
                        />
                      </FormControl>
                      <FormControl isRequired flex={1}>
                        <FormLabel>Автор *</FormLabel>
                        <Input
                          name="author"
                          value={formData.author}
                          onChange={handleChange}
                          placeholder="л. Ім'я Прізвище"
                          size="lg"
                          bg="white"
                          border="1px"
                          borderColor="gray.300"
                          borderRadius="12px"
                        />
                      </FormControl>
                    </HStack>

                    {/* Content */}
                    <FormControl isRequired>
                      <FormLabel>Зміст статті *</FormLabel>
                      <Textarea
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        placeholder="Введіть текст статті...

Використовуйте Markdown для форматування:
- **жирний текст** для виділення
- *курсив* для акценту
- ## Заголовок для підзаголовків
- - Список з пунктів
- Новий абзац - просто порожній рядок"
                        size="lg"
                        bg="white"
                        border="1px"
                        borderColor="gray.300"
                        borderRadius="12px"
                        rows={15}
                        fontFamily="mono"
                        fontSize="sm"
                      />
                      <Text fontSize="sm" color="gray.600" mt={2}>
                        Просто пишіть текст! Форматування робиться автоматично.
                        Використовуйте Markdown: <strong>**жирний**</strong>,{' '}
                        <em>*курсив*</em>, <code>## Заголовок</code>
                      </Text>
                    </FormControl>

                    {/* Publication Status */}
                    <FormControl isRequired>
                      <FormLabel>Статус публікації *</FormLabel>
                      <Select
                        value={(() => {
                          if (formData.status === 'pending') return 'pending';
                          if (formData.status === 'published') {
                            return user?.role === 'admin'
                              ? 'published'
                              : 'pending';
                          }
                          return 'draft';
                        })()}
                        onChange={e => {
                          const selectedValue = e.target.value;
                          // For psychologists, 'published' means 'pending'
                          if (
                            user?.role === 'psychologist' &&
                            selectedValue === 'published'
                          ) {
                            setFormData(prev => ({
                              ...prev,
                              status: 'pending',
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              status: selectedValue,
                            }));
                          }
                        }}
                        size="lg"
                        bg="white"
                        border="1px"
                        borderColor="gray.300"
                        borderRadius="12px"
                      >
                        <option value="draft">Чернетка</option>
                        <option value="published">
                          {user?.role === 'admin'
                            ? 'Опубліковано'
                            : 'Відправити на модерацію'}
                        </option>
                        {formData.status === 'pending' && (
                          <option value="pending">На модерації</option>
                        )}
                      </Select>
                      {user?.role === 'psychologist' &&
                        (formData.status === 'pending' ||
                          formData.status === 'published') && (
                          <Alert
                            status="info"
                            mt={2}
                            borderRadius="8px"
                            fontSize="sm"
                          >
                            <AlertIcon />
                            Стаття буде відправлена на модерацію адміністратору
                            перед публікацією
                          </Alert>
                        )}
                    </FormControl>

                    {error && (
                      <Box
                        p={3}
                        bg="red.50"
                        border="1px"
                        borderColor="red.200"
                        borderRadius="md"
                      >
                        <Text color="red.600">{error}</Text>
                      </Box>
                    )}

                    {/* Actions */}
                    <VStack spacing={3} pt={4} align="stretch" w="100%">
                      <HStack spacing={3} flexWrap="wrap" w="100%">
                        {(user?.role === 'psychologist' &&
                          formData.status !== 'pending') ||
                        (user?.role === 'admin' &&
                          formData.status !== 'published') ? (
                          <Button
                            type="button"
                            variant="outline"
                            borderColor="#D32F2F"
                            color="#D32F2F"
                            bg="white"
                            _hover={{ bg: 'red.50', borderColor: '#B71C1C' }}
                            size={{ base: 'md', md: 'lg' }}
                            fontSize={{ base: 'sm', md: 'md' }}
                            isLoading={saving}
                            onClick={() => handleSubmit(null, true)}
                            flex={{ base: '1 1 100%', md: '0 1 auto' }}
                            minW={{ base: '100%', md: 'auto' }}
                            leftIcon={
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                              </svg>
                            }
                          >
                            {user?.role === 'admin'
                              ? 'Опублікувати'
                              : 'Відправити на модерацію'}
                          </Button>
                        ) : null}
                        <Button
                          type="submit"
                          bg="#D32F2F"
                          color="white"
                          _hover={{ bg: '#B71C1C' }}
                          size={{ base: 'md', md: 'lg' }}
                          fontSize={{ base: 'sm', md: 'md' }}
                          isLoading={saving}
                          flex={{ base: '1 1 100%', md: '0 1 auto' }}
                          minW={{ base: '100%', md: 'auto' }}
                          leftIcon={
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                              <polyline points="17 21 17 13 7 13 7 21"></polyline>
                              <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                          }
                        >
                          {isEdit
                            ? 'Редагувати статтю'
                            : 'Зберегти як чернетку'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          color="gray.600"
                          size={{ base: 'md', md: 'lg' }}
                          fontSize={{ base: 'sm', md: 'md' }}
                          onClick={() => navigate('/')}
                          flex={{ base: '1 1 100%', md: '0 1 auto' }}
                          minW={{ base: '100%', md: 'auto' }}
                        >
                          Скасувати
                        </Button>
                      </HStack>
                    </VStack>
                  </VStack>
                </form>
              </CardBody>
            </Card>
          </Box>

          {/* Right Panel - Publication Info */}
          <Box>
            <Card rounded="xl" boxShadow="sm" position="sticky" top={24}>
              <CardBody>
                <VStack spacing={6} align="stretch">
                  {/* Publication Info */}
                  <Box>
                    <Heading size="md" mb={4}>
                      Інформація
                    </Heading>
                    <VStack spacing={3} align="stretch">
                      {formData.status && (
                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Статус
                          </Text>
                          <Text fontSize="md" fontWeight="medium">
                            {formData.status === 'draft' && 'Чернетка'}
                            {formData.status === 'pending' && 'На модерації'}
                            {formData.status === 'published' && 'Опубліковано'}
                          </Text>
                          {formData.status === 'pending' && (
                            <Alert
                              status="warning"
                              mt={2}
                              borderRadius="8px"
                              fontSize="sm"
                            >
                              <AlertIcon />
                              Стаття очікує на перевірку адміністратором
                            </Alert>
                          )}
                        </Box>
                      )}
                      {creationDate && (
                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Дата створення
                          </Text>
                          <Text fontSize="md" fontWeight="medium">
                            {creationDate}
                          </Text>
                        </Box>
                      )}
                    </VStack>
                  </Box>

                  <Divider />

                  {/* Recommendations */}
                  <Box>
                    <Heading size="md" mb={4}>
                      Рекомендації
                    </Heading>
                    <VStack spacing={3} align="stretch">
                      <HStack align="start" spacing={2}>
                        <Box
                          w="6px"
                          h="6px"
                          bg="#D32F2F"
                          borderRadius="full"
                          mt={2}
                          flexShrink={0}
                        />
                        <Text fontSize="sm" color="gray.700">
                          Використовуйте зрозумілу та професійну мову
                        </Text>
                      </HStack>
                      <HStack align="start" spacing={2}>
                        <Box
                          w="6px"
                          h="6px"
                          bg="#D32F2F"
                          borderRadius="full"
                          mt={2}
                          flexShrink={0}
                        />
                        <Text fontSize="sm" color="gray.700">
                          Додайте підзаголовки для структурування тексту
                        </Text>
                      </HStack>
                      <HStack align="start" spacing={2}>
                        <Box
                          w="6px"
                          h="6px"
                          bg="#D32F2F"
                          borderRadius="full"
                          mt={2}
                          flexShrink={0}
                        />
                        <Text fontSize="sm" color="gray.700">
                          Перевірте правопис перед публікацією
                        </Text>
                      </HStack>
                      <HStack align="start" spacing={2}>
                        <Box
                          w="6px"
                          h="6px"
                          bg="#D32F2F"
                          borderRadius="full"
                          mt={2}
                          flexShrink={0}
                        />
                        <Text fontSize="sm" color="gray.700">
                          Використовуйте якісні зображення високої роздільності
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default ArticleEditPage;
