import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import getImageUrl from '../../utils/imageUrl';
import CustomToast from '../../components/common/CustomToast';
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
      const res = await axios.get(`/api/articles/${articleId}?edit=true`);
      const article = res.data;
      const displayStatus =
        article.status === 'pending' && user?.role === 'psychologist'
          ? 'published'
          : article.status || 'draft';

      setFormData({
        title: article.title || '',
        description: article.description || '',
        image: article.image || '',
        readTime: article.readTime || '5 min',
        author: article.author || '',
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
      setError('Failed to load article');
    } finally {
      setLoading(false);
    }
  }, [articleId, user]);

  useEffect(() => {
    if (isEdit && articleId) {
      loadArticle();
      return;
    }
    if (user?.firstName && user?.lastName) {
      setFormData(prev => ({
        ...prev,
        author: `${user.firstName} ${user.lastName}`,
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

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size should not exceed 10MB');
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
        setError('Failed to upload image');
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
      const submitData = { ...formData };

      if (sendForModeration) {
        if (user?.role === 'admin') {
          submitData.status = 'published';
        } else {
          submitData.status = 'pending';
        }
      } else {
        submitData.status = 'draft';
      }

      let response;
      if (isEdit && articleId) {
        response = await axios.put(`/api/articles/${articleId}`, submitData);
      } else {
        response = await axios.post('/api/articles', submitData);
      }

      const savedStatus = response.data.status;
      if (savedStatus === 'pending') {
        toast({
          title:
            'Article submitted for moderation. Administrator will review it before publication',
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top',
          render: ({ onClose }) => (
            <CustomToast
              title="Article submitted for moderation. Administrator will review it before publication"
              onClose={onClose}
              status="success"
            />
          ),
        });
      } else if (savedStatus === 'published' && user?.role === 'admin') {
        toast({
          title: 'Article published',
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top',
          render: ({ onClose }) => (
            <CustomToast
              title="Article published"
              onClose={onClose}
              status="success"
            />
          ),
        });
      } else {
        toast({
          title: 'Article saved',
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top',
          render: ({ onClose }) => (
            <CustomToast
              title="Article saved"
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
        setError('You do not have permission for this action');
      } else {
        setError(err.response?.data?.error || 'Failed to save article');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxW="1200px" py={8}>
        <Text>Loading...</Text>
      </Container>
    );
  }

  return (
    <Box bg="gray.50" minH="100vh" py={8}>
      <Container maxW="1200px">
        <Heading mb={6} size="xl">
          {isEdit ? 'Edit Article' : 'Add Article'}
        </Heading>

        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
          <Box gridColumn={{ base: '1', lg: 'span 2' }}>
            <Card rounded="xl" boxShadow="sm">
              <CardBody>
                <form onSubmit={handleSubmit}>
                  <VStack spacing={6} align="stretch">
                    <FormControl isRequired>
                      <FormLabel>Article Title *</FormLabel>
                      <Input
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., How to deal with anxiety"
                        size="lg"
                        bg="white"
                        border="1px"
                        borderColor="gray.300"
                        borderRadius="12px"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Short Description *</FormLabel>
                      <Textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Short description of the article that will be displayed in the preview"
                        size="lg"
                        bg="white"
                        border="1px"
                        borderColor="gray.300"
                        borderRadius="12px"
                        rows={3}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Main Image *</FormLabel>
                      <VStack spacing={4} align="stretch">
                        <HStack spacing={4}>
                          <Input
                            name="image"
                            value={formData.image}
                            onChange={handleChange}
                            placeholder="https://example.com/image.jpg or upload a file"
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
                              alt="Image preview"
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
                                    Image loading error
                                  </Text>
                                </Box>
                              }
                            />
                            <IconButton
                              aria-label="Delete image"
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
                          Enter image URL or upload a file (max 10MB)
                        </Text>
                      </VStack>
                    </FormControl>

                    <HStack spacing={4}>
                      <FormControl isRequired flex={1}>
                        <FormLabel>Reading Time *</FormLabel>
                        <Input
                          name="readTime"
                          value={formData.readTime}
                          onChange={handleChange}
                          placeholder="5 min"
                          size="lg"
                          bg="white"
                          border="1px"
                          borderColor="gray.300"
                          borderRadius="12px"
                        />
                      </FormControl>
                      <FormControl isRequired flex={1}>
                        <FormLabel>Author *</FormLabel>
                        <Input
                          name="author"
                          value={formData.author}
                          onChange={handleChange}
                          placeholder="Author Name"
                          size="lg"
                          bg="white"
                          border="1px"
                          borderColor="gray.300"
                          borderRadius="12px"
                        />
                      </FormControl>
                    </HStack>

                    <FormControl isRequired>
                      <FormLabel>Article Content *</FormLabel>
                      <Textarea
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        placeholder="Enter article text...

Use Markdown for formatting:
- **bold text** for emphasis
- *italic* for accent
- ## Heading for subheadings
- - List items
- New paragraph - just an empty line"
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
                        Just write text! Formatting is done automatically. Use
                        Markdown: <strong>**bold**</strong>, <em>*italic*</em>,{' '}
                        <code>## Heading</code>
                      </Text>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Publication Status *</FormLabel>
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
                        <option value="draft">Draft</option>
                        <option value="published">
                          {user?.role === 'admin'
                            ? 'Published'
                            : 'Submit for moderation'}
                        </option>
                        {formData.status === 'pending' && (
                          <option value="pending">Under moderation</option>
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
                            Article will be sent for moderation to administrator
                            before publication
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
                              ? 'Publish'
                              : 'Submit for moderation'}
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
                          {isEdit ? 'Update Article' : 'Save as Draft'}
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
                          Cancel
                        </Button>
                      </HStack>
                    </VStack>
                  </VStack>
                </form>
              </CardBody>
            </Card>
          </Box>

          <Box>
            <Card rounded="xl" boxShadow="sm" position="sticky" top={24}>
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="md" mb={4}>
                      Information
                    </Heading>
                    <VStack spacing={3} align="stretch">
                      {formData.status && (
                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Status
                          </Text>
                          <Text fontSize="md" fontWeight="medium">
                            {formData.status === 'draft' && 'Draft'}
                            {formData.status === 'pending' &&
                              'Under moderation'}
                            {formData.status === 'published' && 'Published'}
                          </Text>
                          {formData.status === 'pending' && (
                            <Alert
                              status="warning"
                              mt={2}
                              borderRadius="8px"
                              fontSize="sm"
                            >
                              <AlertIcon />
                              Article is awaiting administrator review
                            </Alert>
                          )}
                        </Box>
                      )}
                      {creationDate && (
                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Creation Date
                          </Text>
                          <Text fontSize="md" fontWeight="medium">
                            {creationDate}
                          </Text>
                        </Box>
                      )}
                    </VStack>
                  </Box>

                  <Divider />

                  <Box>
                    <Heading size="md" mb={4}>
                      Recommendations
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
                          Use clear and professional language
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
                          Add subheadings to structure the text
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
                          Check spelling before publication
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
                          Use high-resolution quality images
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
