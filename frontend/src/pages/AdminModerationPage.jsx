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
  Link,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import getImageUrl from '../utils/imageUrl';

const AdminModerationPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [articles, setArticles] = useState([]);
  const [psychologists, setPsychologists] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [loadingPsychologists, setLoadingPsychologists] = useState(true);
  const [processingArticleIds, setProcessingArticleIds] = useState(new Set());
  const [processingPsychologistIds, setProcessingPsychologistIds] = useState(
    new Set()
  );
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [activeTab, setActiveTab] = useState('articles');
  const [rejectionArticle, setRejectionArticle] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isRejectModalOpen,
    onOpen: onRejectModalOpen,
    onClose: onRejectModalClose,
  } = useDisclosure();

  const loadPendingArticles = useCallback(async () => {
    try {
      setLoadingArticles(true);
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
      }
    } finally {
      setLoadingArticles(false);
    }
  }, [navigate, toast]);

  const loadPendingPsychologists = useCallback(async () => {
    try {
      setLoadingPsychologists(true);
      const res = await axios.get('/api/admin/psychologists/pending');
      setPsychologists(res.data || []);
    } catch (err) {
      console.error('Failed to load pending psychologists:', err);
      console.error('Error response:', err.response);

      if (err.response?.status === 401) {
        toast({
          title: 'Потрібна авторизація',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top',
          render: ({ onClose }) => (
            <CustomToast
              title="Потрібна авторизація. Будь ласка, увійдіть в систему."
              onClose={onClose}
              status="error"
            />
          ),
        });
        navigate('/login');
      } else if (err.response?.status === 403) {
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
      } else if (err.response?.status === 400) {
        toast({
          title: 'Помилка завантаження',
          description:
            err.response?.data?.error ||
            err.response?.data?.message ||
            'Невірний запит',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top',
          render: ({ onClose }) => (
            <CustomToast
              title={
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Помилка завантаження психологів'
              }
              onClose={onClose}
              status="error"
            />
          ),
        });
      } else {
        toast({
          title: 'Помилка завантаження',
          description:
            err.response?.data?.error ||
            'Не вдалося завантажити список психологів',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top',
          render: ({ onClose }) => (
            <CustomToast
              title={
                err.response?.data?.error ||
                'Не вдалося завантажити список психологів'
              }
              onClose={onClose}
              status="error"
            />
          ),
        });
      }
      // Set empty array on error to prevent UI issues
      setPsychologists([]);
    } finally {
      setLoadingPsychologists(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    loadPendingArticles();
    loadPendingPsychologists();
  }, [loadPendingArticles, loadPendingPsychologists]);

  const handleApproveArticle = async articleId => {
    try {
      setProcessingArticleIds(prev => new Set(prev).add(articleId));
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
      setProcessingArticleIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(articleId);
        return newSet;
      });
    }
  };

  const handleRejectArticleClick = article => {
    setRejectionArticle(article);
    setRejectionReason('');
    onRejectModalOpen();
  };

  const handleRejectArticle = async () => {
    if (!rejectionArticle || !rejectionReason.trim()) {
      toast({
        title: 'Будь ласка, вкажіть причину відхилення',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title="Будь ласка, вкажіть причину відхилення"
            onClose={onClose}
            status="error"
          />
        ),
      });
      return;
    }

    try {
      setProcessingArticleIds(prev => new Set(prev).add(rejectionArticle.id));
      await axios.post(`/api/admin/articles/${rejectionArticle.id}/reject`, {
        rejectionReason: rejectionReason.trim(),
      });
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
      setArticles(prev =>
        prev.filter(article => article.id !== rejectionArticle.id)
      );
      onRejectModalClose();
      setRejectionArticle(null);
      setRejectionReason('');
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
      setProcessingArticleIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(rejectionArticle?.id);
        return newSet;
      });
    }
  };

  const handleApprovePsychologist = async psychologistId => {
    try {
      setProcessingPsychologistIds(prev => new Set(prev).add(psychologistId));
      await axios.post(`/api/admin/psychologists/${psychologistId}/approve`);
      toast({
        title: 'Психолога схвалено',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title="Психолога схвалено"
            onClose={onClose}
            status="success"
          />
        ),
      });
      setPsychologists(prev =>
        prev.filter(psychologist => psychologist.id !== psychologistId)
      );
    } catch (err) {
      console.error('Failed to approve psychologist:', err);
      toast({
        title: err.response?.data?.error || 'Не вдалося схвалити психолога',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title={err.response?.data?.error || 'Не вдалося схвалити психолога'}
            onClose={onClose}
            status="error"
          />
        ),
      });
    } finally {
      setProcessingPsychologistIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(psychologistId);
        return newSet;
      });
    }
  };

  const handleRejectPsychologist = async psychologistId => {
    try {
      setProcessingPsychologistIds(prev => new Set(prev).add(psychologistId));
      await axios.post(`/api/admin/psychologists/${psychologistId}/reject`);
      toast({
        title: 'Психолога відхилено',
        status: 'info',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title="Психолога відхилено"
            onClose={onClose}
            status="info"
          />
        ),
      });
      setPsychologists(prev =>
        prev.filter(psychologist => psychologist.id !== psychologistId)
      );
    } catch (err) {
      console.error('Failed to reject psychologist:', err);
      toast({
        title: err.response?.data?.error || 'Не вдалося відхилити психолога',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title={
              err.response?.data?.error || 'Не вдалося відхилити психолога'
            }
            onClose={onClose}
            status="error"
          />
        ),
      });
    } finally {
      setProcessingPsychologistIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(psychologistId);
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

  const viewDocument = documentUrl => {
    setSelectedDocument(documentUrl);
    onOpen();
  };

  if (loadingArticles && loadingPsychologists) {
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
    <Box bg="gray.50" minH="100vh" py={8}>
      <Container maxW="1200px">
        <Heading as="h1" size="xl" color="gray.800" mb={8}>
          Модерація
        </Heading>

        {/* Custom Tab Switcher */}
        <Box mb={8}>
          <HStack spacing={2} bg="gray.100" p={1.5} rounded="full" maxW="400px">
            <Button
              onClick={() => setActiveTab('articles')}
              h="44px"
              px={6}
              borderRadius="full"
              fontWeight="semibold"
              fontSize="md"
              bg={activeTab === 'articles' ? '#D32F2F' : 'white'}
              color={activeTab === 'articles' ? 'white' : 'gray.800'}
              borderWidth={activeTab === 'articles' ? 0 : 1}
              borderColor="gray.200"
              boxShadow={activeTab === 'articles' ? 'sm' : 'none'}
              _hover={{
                bg: activeTab === 'articles' ? '#B71C1C' : 'gray.50',
              }}
              flex={1}
            >
              Статті
              {articles.length > 0 && (
                <Badge
                  ml={2}
                  bg={
                    activeTab === 'articles'
                      ? 'rgba(255, 255, 255, 0.3)'
                      : '#D32F2F'
                  }
                  color="white"
                  borderRadius="full"
                  px={2}
                  py={0.5}
                  fontSize="xs"
                  fontWeight="bold"
                >
                  {articles.length}
                </Badge>
              )}
            </Button>
            <Button
              onClick={() => setActiveTab('psychologists')}
              h="44px"
              px={6}
              borderRadius="full"
              fontWeight="semibold"
              fontSize="md"
              bg={activeTab === 'psychologists' ? '#D32F2F' : 'white'}
              color={activeTab === 'psychologists' ? 'white' : 'gray.800'}
              borderWidth={activeTab === 'psychologists' ? 0 : 1}
              borderColor="gray.200"
              boxShadow={activeTab === 'psychologists' ? 'sm' : 'none'}
              _hover={{
                bg: activeTab === 'psychologists' ? '#B71C1C' : 'gray.50',
              }}
              flex={1}
            >
              Психологи
              {psychologists.length > 0 && (
                <Badge
                  ml={2}
                  bg={
                    activeTab === 'psychologists'
                      ? 'rgba(255, 255, 255, 0.3)'
                      : '#D32F2F'
                  }
                  color="white"
                  borderRadius="full"
                  px={2}
                  py={0.5}
                  fontSize="xs"
                  fontWeight="bold"
                >
                  {psychologists.length}
                </Badge>
              )}
            </Button>
          </HStack>
        </Box>

        {/* Articles Tab */}
        {activeTab === 'articles' && (
          <Box>
            {loadingArticles ? (
              <Box textAlign="center" py={12}>
                <Spinner size="xl" color="#D32F2F" />
              </Box>
            ) : articles.length === 0 ? (
              <Card>
                <CardBody p={12} textAlign="center">
                  <Text color="gray.500" fontSize="lg">
                    Немає статей, які очікують на модерацію
                  </Text>
                </CardBody>
              </Card>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {articles.map(article => (
                  <Card key={article.id} rounded="xl" boxShadow="sm">
                    <CardBody p={6}>
                      <VStack align="stretch" spacing={4}>
                        {article.image && (
                          <Image
                            src={getImageUrl(article.image)}
                            alt={article.title}
                            borderRadius="lg"
                            h="200px"
                            fit="cover"
                            w="100%"
                          />
                        )}
                        <Box>
                          <Heading as="h3" size="md" mb={2}>
                            {article.title}
                          </Heading>
                          <Text color="gray.600" fontSize="sm" noOfLines={3}>
                            {article.description}
                          </Text>
                        </Box>
                        <HStack justify="space-between">
                          <Text color="gray.500" fontSize="xs">
                            {formatDate(article.createdAt)}
                          </Text>
                          <Badge colorScheme="orange">Очікує модерації</Badge>
                        </HStack>
                        <Divider />
                        <HStack spacing={3}>
                          <Button
                            size="sm"
                            bg="#D32F2F"
                            color="white"
                            _hover={{ bg: '#B71C1C' }}
                            onClick={() => handleApproveArticle(article.id)}
                            isLoading={processingArticleIds.has(article.id)}
                            flex={1}
                          >
                            Схвалити
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="gray"
                            onClick={() => handleRejectArticleClick(article)}
                            isLoading={processingArticleIds.has(article.id)}
                            flex={1}
                          >
                            Відхилити
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/article/${article.id}`)}
                          >
                            Переглянути
                          </Button>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Box>
        )}

        {/* Psychologists Tab */}
        {activeTab === 'psychologists' && (
          <Box>
            {loadingPsychologists ? (
              <Box textAlign="center" py={12}>
                <Spinner size="xl" color="#D32F2F" />
              </Box>
            ) : psychologists.length === 0 ? (
              <Card>
                <CardBody p={12} textAlign="center">
                  <Text color="gray.500" fontSize="lg">
                    Немає психологів, які очікують на модерацію
                  </Text>
                </CardBody>
              </Card>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {psychologists.map(psychologist => (
                  <Card key={psychologist.id} rounded="xl" boxShadow="sm">
                    <CardBody p={6}>
                      <VStack align="stretch" spacing={4}>
                        <HStack spacing={4}>
                          {psychologist.User?.photoUrl && (
                            <Image
                              src={getImageUrl(psychologist.User.photoUrl)}
                              alt={
                                psychologist.User.firstName +
                                ' ' +
                                psychologist.User.lastName
                              }
                              borderRadius="full"
                              boxSize="80px"
                              fit="cover"
                            />
                          )}
                          <Box flex={1}>
                            <Heading as="h3" size="md" mb={1}>
                              {psychologist.User?.firstName || ''}{' '}
                              {psychologist.User?.lastName || ''}
                            </Heading>
                            <Text color="gray.600" fontSize="sm">
                              {psychologist.User?.email}
                            </Text>
                            {psychologist.specialization && (
                              <Text color="gray.500" fontSize="sm" mt={1}>
                                {psychologist.specialization}
                              </Text>
                            )}
                          </Box>
                        </HStack>
                        <Divider />
                        <Box>
                          <Text color="gray.600" fontSize="sm" mb={2}>
                            <strong>Досвід:</strong>{' '}
                            {psychologist.experience || 0} років
                          </Text>
                          {psychologist.bio && (
                            <Text color="gray.600" fontSize="sm" noOfLines={3}>
                              <strong>Про себе:</strong> {psychologist.bio}
                            </Text>
                          )}
                          {psychologist.price && (
                            <Text color="gray.600" fontSize="sm" mt={2}>
                              <strong>Ціна за сесію:</strong>{' '}
                              {psychologist.price} ₴
                            </Text>
                          )}
                        </Box>
                        {psychologist.qualificationDocument && (
                          <Box>
                            <Button
                              size="sm"
                              variant="outline"
                              colorScheme="blue"
                              onClick={() =>
                                viewDocument(psychologist.qualificationDocument)
                              }
                              width="100%"
                            >
                              Переглянути документ про кваліфікацію
                            </Button>
                          </Box>
                        )}
                        <HStack justify="space-between">
                          <Text color="gray.500" fontSize="xs">
                            {formatDate(psychologist.createdAt)}
                          </Text>
                          <Badge colorScheme="orange">Очікує модерації</Badge>
                        </HStack>
                        <Divider />
                        <HStack spacing={3}>
                          <Button
                            size="sm"
                            bg="#D32F2F"
                            color="white"
                            _hover={{ bg: '#B71C1C' }}
                            onClick={() =>
                              handleApprovePsychologist(psychologist.id)
                            }
                            isLoading={processingPsychologistIds.has(
                              psychologist.id
                            )}
                            flex={1}
                          >
                            Схвалити
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="gray"
                            onClick={() =>
                              handleRejectPsychologist(psychologist.id)
                            }
                            isLoading={processingPsychologistIds.has(
                              psychologist.id
                            )}
                            flex={1}
                          >
                            Відхилити
                          </Button>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Box>
        )}
      </Container>

      {/* Reject Article Modal */}
      <Modal isOpen={isRejectModalOpen} onClose={onRejectModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Відхилити статтю</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                Ви впевнені, що хочете відхилити статтю &quot;
                {rejectionArticle?.title}&quot;?
              </Text>
              <FormControl isRequired>
                <FormLabel>Причина відхилення</FormLabel>
                <Textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Вкажіть причину відхилення статті..."
                  rows={5}
                  resize="vertical"
                  bg="white"
                  border="1px"
                  borderColor="gray.300"
                  borderRadius="8px"
                  _focus={{
                    borderColor: '#D32F2F',
                    boxShadow: '0 0 0 1px #D32F2F',
                  }}
                />
                <Text color="gray.500" fontSize="sm" mt={1}>
                  Причина буде відправлена автору статті на email
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={onRejectModalClose}
              mr={3}
              borderRadius="12px"
            >
              Скасувати
            </Button>
            <Button
              bg="#D32F2F"
              color="white"
              _hover={{ bg: '#B71C1C' }}
              onClick={handleRejectArticle}
              isLoading={processingArticleIds.has(rejectionArticle?.id)}
              isDisabled={!rejectionReason.trim()}
              borderRadius="12px"
            >
              Відхилити статтю
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Document Viewer Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Документ про кваліфікацію</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedDocument && (
              <Box>
                {selectedDocument.endsWith('.pdf') ? (
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
    </Box>
  );
};

export default AdminModerationPage;
