import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Heading,
  Button,
  Input,
  FormControl,
  FormLabel,
  VStack,
  HStack,
  Card,
  CardBody,
  Container,
  Avatar,
  IconButton,
  Textarea,
  Switch,
  Text,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Image,
  Link,
  Badge,
} from '@chakra-ui/react';
import CustomToast from '../components/CustomToast';
import getImageUrl from '../utils/imageUrl';

const ProfilePage = () => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [me, setMe] = useState(user);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [updatingNotifications, setUpdatingNotifications] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
  } = useDisclosure();
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef(null);

  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const [psychProfile, setPsychProfile] = useState({
    specialization: '',
    experience: 0,
    bio: '',
    price: '',
  });

  useEffect(() => {
    const fetchMe = async () => {
      if (!isAuthenticated || !user) {
        return;
      }
      try {
        const res = await axios.get('/api/auth/me');
        const userData = res.data;
        setMe(userData);
        setUserProfile({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
        });
        setEmailNotifications(userData.emailNotifications ?? true);
        if (userData.psychologist) {
          setPsychProfile({
            specialization: userData.psychologist.specialization || '',
            experience: userData.psychologist.experience ?? 0,
            bio: userData.psychologist.bio || '',
            price:
              userData.psychologist.price === null ||
              userData.psychologist.price === undefined
                ? ''
                : String(userData.psychologist.price),
          });
        }
      } catch (e) {
        console.error('Failed to fetch profile:', e);
        // If 401, the AuthContext will handle token cleanup
        if (e.response?.status === 401) {
          // Token is invalid, AuthContext will handle logout
        }
      }
    };
    fetchMe();
  }, [isAuthenticated, user]);

  const onChangeUser = e => {
    const { name, value } = e.target;
    setUserProfile(p => ({ ...p, [name]: value }));
  };

  const onChangePsych = e => {
    const { name, value } = e.target;
    setPsychProfile(p => ({ ...p, [name]: value }));
  };

  const handlePhotoUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Будь ласка, оберіть файл зображення');
      e.target.value = ''; // Clear input
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Розмір файлу не повинен перевищувати 10MB');
      e.target.value = ''; // Clear input
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await axios.post('/api/auth/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMe({ ...me, photoUrl: res.data.photoUrl });
      setMessage('Фото оновлено');
      e.target.value = ''; // Clear input after successful upload
    } catch (err) {
      console.error('Photo upload error:', err);
      if (err.response?.status === 400) {
        if (err.response.data?.msg?.includes('too large')) {
          setError('Файл занадто великий. Максимальний розмір: 10MB');
        } else {
          setError(err.response.data?.msg || 'Не вдалося завантажити фото');
        }
      } else {
        setError('Не вдалося завантажити фото');
      }
      e.target.value = ''; // Clear input on error
    } finally {
      setUploading(false);
    }
  };

  const onSubmitUser = async e => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await axios.put('/api/psychologists/profile', userProfile);
      setMessage('Профіль оновлено');
      await axios.get('/api/auth/me').then(res => setMe(res.data));
    } catch (err) {
      setError(err?.response?.data?.msg || 'Не вдалося оновити');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitPsych = async e => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await axios.put('/api/psychologists/profile', psychProfile);
      setMessage('Профіль психолога оновлено');
      // Refresh user data to get updated psychologist info
      const res = await axios.get('/api/auth/me');
      setMe(res.data);
    } catch (err) {
      setError(err?.response?.data?.msg || 'Не вдалося оновити');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailNotificationsToggle = async e => {
    const newValue = e.target.checked;
    setUpdatingNotifications(true);
    try {
      await axios.put('/api/auth/settings/email-notifications', {
        emailNotifications: newValue,
      });
      setEmailNotifications(newValue);
      setMe({ ...me, emailNotifications: newValue });
      toast({
        title: newValue
          ? 'Email-повідомлення увімкнено'
          : 'Email-повідомлення вимкнено',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title={
              newValue
                ? 'Email-повідомлення увімкнено'
                : 'Email-повідомлення вимкнено'
            }
            onClose={onClose}
            status="success"
          />
        ),
      });
    } catch (err) {
      console.error('Failed to update email notifications:', err);
      toast({
        title: 'Не вдалося оновити налаштування',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title="Не вдалося оновити налаштування"
            onClose={onClose}
            status="error"
          />
        ),
      });
    } finally {
      setUpdatingNotifications(false);
    }
  };

  const viewDocument = (documentUrl, filename) => {
    setSelectedDocument({
      url: documentUrl,
      filename: filename || documentUrl,
    });
    onOpen();
  };

  const isPdfFile = urlOrFilename => {
    if (!urlOrFilename) return false;
    const lower = urlOrFilename.toLowerCase();
    return lower.endsWith('.pdf') || lower.includes('.pdf');
  };

  const validateFile = file => {
    if (!file) return false;

    // Validate file type (PDF, images)
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Неправильний тип файлу. Дозволені тільки PDF та зображення',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title="Неправильний тип файлу. Дозволені тільки PDF та зображення"
            onClose={onClose}
            status="error"
          />
        ),
      });
      return false;
    }
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Розмір файлу не повинен перевищувати 10MB',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title="Розмір файлу не повинен перевищувати 10MB"
            onClose={onClose}
            status="error"
          />
        ),
      });
      return false;
    }
    return true;
  };

  const handleDocumentUpload = async file => {
    if (!file || !validateFile(file)) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setUploadingDocument(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('qualificationDocument', file);

      await axios.post('/api/auth/upload-qualification', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Refresh user data to get updated documents
      const meRes = await axios.get('/api/auth/me');
      setMe(meRes.data);
      toast({
        title: 'Документ про кваліфікацію успішно завантажено',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title="Документ про кваліфікацію успішно завантажено"
            onClose={onClose}
            status="success"
          />
        ),
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Document upload error:', err);
      const errorMsg = err.response?.data?.msg?.includes('too large')
        ? 'Файл занадто великий. Максимальний розмір: 10MB'
        : err.response?.data?.msg || 'Не вдалося завантажити документ';
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      handleDocumentUpload(file);
    }
  };

  const handleDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleDocumentUpload(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = bytes => {
    if (!bytes || bytes === 0) return 'Розмір невідомий';
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  };

  const formatDate = date => {
    if (!date) return 'Дата невідома';
    const dateObj = new Date(date);
    if (Number.isNaN(dateObj.getTime())) {
      return 'Дата невідома';
    }
    return dateObj.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDocumentDelete = async () => {
    if (!documentToDelete) return;

    setDeletingDocument(true);
    setError('');
    setMessage('');

    try {
      await axios.delete(`/api/auth/qualification/${documentToDelete.id}`);

      // Refresh user data to get updated documents
      const meRes = await axios.get('/api/auth/me');
      setMe(meRes.data);
      setDocumentToDelete(null);
      onDeleteModalClose();
      toast({
        title: 'Документ про кваліфікацію видалено',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title="Документ про кваліфікацію видалено"
            onClose={onClose}
            status="success"
          />
        ),
      });
    } catch (err) {
      console.error('Document delete error:', err);
      toast({
        title: 'Не вдалося видалити документ',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
        render: ({ onClose }) => (
          <CustomToast
            title="Не вдалося видалити документ"
            onClose={onClose}
            status="error"
          />
        ),
      });
    } finally {
      setDeletingDocument(false);
    }
  };

  const openDeleteModal = document => {
    setDocumentToDelete(document);
    onDeleteModalOpen();
  };

  return (
    <Box bg="gray.50" minH="100vh" py={8}>
      <Container maxW="900px">
        <Heading mb={8}>Мій профіль</Heading>

        {message && (
          <Box color="green.500" mb={4}>
            {message}
          </Box>
        )}
        {error && (
          <Box color="red.500" mb={4}>
            {error}
          </Box>
        )}

        <Card mb={6} rounded="2xl" boxShadow="sm">
          <CardBody>
            <Heading size="md" mb={6}>
              Особисті дані
            </Heading>
            <VStack spacing={6} align="stretch">
              <Box
                textAlign="center"
                position="relative"
                display="inline-block"
                alignSelf="center"
              >
                <Avatar
                  size="2xl"
                  src={me?.photoUrl ? getImageUrl(me.photoUrl) : null}
                  mb={3}
                />
                <Box position="absolute" bottom="8px" right="8px">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                    id="photo-upload"
                    disabled={uploading}
                  />
                  <IconButton
                    as="label"
                    htmlFor="photo-upload"
                    icon={
                      <svg
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    }
                    size="sm"
                    borderRadius="full"
                    bg="red.500"
                    color="white"
                    _hover={{ bg: 'red.600' }}
                    cursor="pointer"
                    isLoading={uploading}
                    disabled={uploading}
                    aria-label="Завантажити фото"
                  />
                </Box>
              </Box>

              <form onSubmit={onSubmitUser}>
                <VStack spacing={4} align="stretch">
                  <HStack spacing={4}>
                    <FormControl>
                      <FormLabel>Ім'я</FormLabel>
                      <Input
                        name="firstName"
                        value={userProfile.firstName}
                        onChange={onChangeUser}
                        placeholder="Ваше ім'я"
                        size="lg"
                        bg="gray.50"
                        border="none"
                        borderRadius="12px"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Прізвище</FormLabel>
                      <Input
                        name="lastName"
                        value={userProfile.lastName}
                        onChange={onChangeUser}
                        placeholder="Ваше прізвище"
                        size="lg"
                        bg="gray.50"
                        border="none"
                        borderRadius="12px"
                      />
                    </FormControl>
                  </HStack>

                  <FormControl>
                    <FormLabel>Електронна пошта</FormLabel>
                    <Input
                      name="email"
                      value={userProfile.email}
                      onChange={onChangeUser}
                      placeholder="your@email.com"
                      size="lg"
                      bg="gray.50"
                      border="none"
                      borderRadius="12px"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    size="lg"
                    h="52px"
                    borderRadius="12px"
                    bg="#D32F2F"
                    _hover={{ bg: '#B71C1C' }}
                    color="white"
                    isLoading={loading}
                    loadingText="Зберігаємо..."
                    mt={2}
                    w="auto"
                    alignSelf="flex-start"
                  >
                    Зберегти особисті дані
                  </Button>
                </VStack>
              </form>
            </VStack>
          </CardBody>
        </Card>

        {/* Email Notifications Settings */}
        <Card mb={6} rounded="2xl" boxShadow="sm">
          <CardBody>
            <Heading size="md" mb={6}>
              Налаштування повідомлень
            </Heading>
            <VStack spacing={4} align="stretch">
              <FormControl
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <FormLabel mb={1} fontWeight="medium">
                    Email-повідомлення про нові статті
                  </FormLabel>
                  <Text fontSize="sm" color="gray.600">
                    Отримувати повідомлення на email при публікації нових статей
                  </Text>
                </Box>
                <Switch
                  isChecked={emailNotifications}
                  onChange={handleEmailNotificationsToggle}
                  colorScheme="red"
                  size="lg"
                  isDisabled={updatingNotifications}
                />
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {me?.role === 'psychologist' && (
          <Card mb={6} rounded="2xl" boxShadow="sm">
            <CardBody>
              <Heading size="md" mb={6}>
                Професійна інформація
              </Heading>
              <form onSubmit={onSubmitPsych}>
                <VStack spacing={4} align="stretch">
                  <HStack spacing={4}>
                    <FormControl flex={2}>
                      <FormLabel>Спеціалізація</FormLabel>
                      <Input
                        name="specialization"
                        value={psychProfile.specialization}
                        onChange={onChangePsych}
                        placeholder="Ваша спеціалізація"
                        size="lg"
                        bg="gray.50"
                        border="none"
                        borderRadius="12px"
                      />
                    </FormControl>
                    <FormControl flex={1}>
                      <FormLabel>Роки досвіду</FormLabel>
                      <Input
                        name="experience"
                        type="number"
                        value={psychProfile.experience}
                        onChange={onChangePsych}
                        size="lg"
                        bg="gray.50"
                        border="none"
                        borderRadius="12px"
                      />
                    </FormControl>
                  </HStack>

                  <FormControl>
                    <FormLabel>Про себе</FormLabel>
                    <Textarea
                      name="bio"
                      value={psychProfile.bio}
                      onChange={onChangePsych}
                      placeholder="Розкажіть про себе"
                      size="lg"
                      bg="gray.50"
                      border="none"
                      borderRadius="12px"
                      rows={4}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Ціна за сесію (грн)</FormLabel>
                    <Input
                      name="price"
                      type="number"
                      step="0.01"
                      value={psychProfile.price}
                      onChange={onChangePsych}
                      size="lg"
                      bg="gray.50"
                      border="none"
                      borderRadius="12px"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    size="lg"
                    h="52px"
                    borderRadius="12px"
                    bg="#D32F2F"
                    _hover={{ bg: '#B71C1C' }}
                    color="white"
                    isLoading={loading}
                    loadingText="Зберігаємо..."
                    mt={2}
                    w="auto"
                    alignSelf="flex-start"
                  >
                    Зберегти професійні дані
                  </Button>
                </VStack>
              </form>
            </CardBody>
          </Card>
        )}

        {/* Documents Section for Psychologists */}
        {me?.role === 'psychologist' && (
          <Card mb={6} rounded="2xl" boxShadow="sm">
            <CardBody>
              {/* Header Section */}
              <HStack justify="space-between" align="flex-start" mb={6}>
                <HStack spacing={3} align="flex-start">
                  <Box
                    p={2}
                    bg="red.50"
                    borderRadius="8px"
                    color="#D32F2F"
                    mt={1}
                  >
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
                    </svg>
                  </Box>
                  <VStack align="flex-start" spacing={1}>
                    <Heading size="md" color="gray.800">
                      Документи про кваліфікацію
                    </Heading>
                    <Text color="gray.600" fontSize="sm">
                      Керуйте документами, які будуть видимі іншим користувачам
                    </Text>
                  </VStack>
                </HStack>
              </HStack>

              <VStack spacing={6} align="stretch">
                {/* Drag and Drop Upload Area */}
                <Box>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/*,application/pdf,image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleFileChange}
                    display="none"
                    id="document-upload-new"
                    disabled={uploadingDocument}
                  />
                  <Box
                    border="2px dashed"
                    borderColor="#D32F2F"
                    borderRadius="12px"
                    p={12}
                    textAlign="center"
                    cursor="pointer"
                    bg="red.50"
                    transition="all 0.2s"
                    minH="200px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    _hover={{
                      borderColor: '#B71C1C',
                      bg: 'red.100',
                    }}
                    onClick={handleUploadClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <VStack spacing={4}>
                      <Box
                        width="80px"
                        height="80px"
                        color="#D32F2F"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        transition="transform 0.2s"
                        transform={isDragging ? 'scale(1.1)' : 'scale(1)'}
                      >
                        <svg
                          width="80"
                          height="80"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                      </Box>
                      <VStack spacing={1}>
                        <Text
                          color="#D32F2F"
                          fontWeight="semibold"
                          fontSize="lg"
                          cursor="pointer"
                        >
                          Натисніть для завантаження документа
                        </Text>
                        <Text color="gray.600" fontSize="sm">
                          PDF або зображення, максимум 10МВ
                        </Text>
                      </VStack>
                    </VStack>
                  </Box>
                </Box>

                {/* Documents List */}
                {me?.psychologist?.qualificationDocuments &&
                  me.psychologist.qualificationDocuments.length > 0 && (
                    <VStack spacing={3} align="stretch">
                      {me.psychologist.qualificationDocuments.map(doc => (
                        <Box
                          key={doc.id}
                          p={4}
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="12px"
                          bg="white"
                          _hover={{ borderColor: 'gray.300', boxShadow: 'sm' }}
                          transition="all 0.2s"
                        >
                          <HStack
                            justify="space-between"
                            align="center"
                            spacing={4}
                          >
                            <HStack spacing={3} flex={1}>
                              <Box
                                p={2}
                                border="1px solid"
                                borderColor="red.200"
                                borderRadius="8px"
                                bg="white"
                                color="#D32F2F"
                              >
                                <svg
                                  width="24"
                                  height="24"
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
                                </svg>
                              </Box>
                              <VStack align="flex-start" spacing={1} flex={1}>
                                <HStack
                                  spacing={2}
                                  align="center"
                                  flexWrap="wrap"
                                >
                                  <Text
                                    fontWeight="semibold"
                                    color="gray.800"
                                    fontSize="md"
                                  >
                                    {doc.filename}
                                  </Text>
                                  {doc.isVerified && (
                                    <Badge
                                      px={2}
                                      py={0.5}
                                      borderRadius="full"
                                      bg="green.50"
                                      color="green.700"
                                      fontSize="xs"
                                      fontWeight="medium"
                                      display="flex"
                                      alignItems="center"
                                      gap={1}
                                    >
                                      <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                      </svg>
                                      Верифіковано
                                    </Badge>
                                  )}
                                </HStack>
                                <HStack
                                  spacing={2}
                                  color="gray.500"
                                  fontSize="sm"
                                >
                                  <Text>
                                    Завантажено {formatDate(doc.uploadedAt)}
                                  </Text>
                                  <Text>•</Text>
                                  <Text>{formatFileSize(doc.fileSize)}</Text>
                                </HStack>
                              </VStack>
                            </HStack>
                            <HStack spacing={2}>
                              <IconButton
                                icon={
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
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                  </svg>
                                }
                                variant="ghost"
                                size="sm"
                                color="gray.600"
                                _hover={{ bg: 'gray.100', color: '#D32F2F' }}
                                aria-label="Переглянути"
                                onClick={() =>
                                  viewDocument(doc.fileUrl, doc.filename)
                                }
                              />
                              <IconButton
                                icon={
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
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                  </svg>
                                }
                                variant="ghost"
                                size="sm"
                                color="gray.600"
                                _hover={{ bg: 'gray.100', color: '#D32F2F' }}
                                aria-label="Завантажити"
                                as={Link}
                                href={getImageUrl(doc.fileUrl)}
                                download={doc.filename}
                              />
                              <IconButton
                                icon={
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
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                }
                                variant="ghost"
                                size="sm"
                                color="gray.600"
                                _hover={{ bg: 'red.50', color: 'red.600' }}
                                aria-label="Видалити"
                                onClick={() => openDeleteModal(doc)}
                              />
                            </HStack>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  )}
              </VStack>
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
                  {isPdfFile(
                    selectedDocument.filename || selectedDocument.url
                  ) ? (
                    <iframe
                      src={getImageUrl(selectedDocument.url)}
                      width="100%"
                      height="600px"
                      style={{ border: 'none' }}
                      title="Qualification Document"
                    />
                  ) : (
                    <Image
                      src={getImageUrl(selectedDocument.url)}
                      alt="Qualification Document"
                      maxH="600px"
                      mx="auto"
                      display="block"
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
                  href={getImageUrl(selectedDocument.url)}
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

        {/* Delete Confirmation Modal */}
        <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Видалити документ про кваліфікацію</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>
                Ви впевнені, що хочете видалити документ про кваліфікацію
                {documentToDelete && ` "${documentToDelete.filename}"`}? Цю дію
                неможливо скасувати.
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="ghost"
                onClick={onDeleteModalClose}
                mr={3}
                borderRadius="12px"
              >
                Скасувати
              </Button>
              <Button
                bg="#D32F2F"
                color="white"
                _hover={{ bg: '#B71C1C' }}
                onClick={handleDocumentDelete}
                isLoading={deletingDocument}
                disabled={deletingDocument}
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
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
};

export default ProfilePage;
