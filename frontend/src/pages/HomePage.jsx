import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import getImageUrl from '../utils/imageUrl';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  Image,
  HStack,
  Container,
  Divider,
  VStack,
  Link,
  Spinner,
} from '@chakra-ui/react';

const HomePage = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const res = await axios.get('/api/articles');
        setArticles(res.data || []);
      } catch (err) {
        console.error('Failed to load articles:', err);
        setError('Не вдалося завантажити статті');
      } finally {
        setLoading(false);
      }
    };
    loadArticles();
  }, []);

  return (
    <Box bg="white" minH="100vh">
      <Container maxW="1200px" py={{ base: 8, md: 12 }}>
        {/* Header Section */}
        <VStack spacing={4} mb={12} textAlign="center">
          <Heading as="h1" size="2xl" color="gray.800">
            Корисні статті
          </Heading>
          <Text color="gray.600" fontSize="lg" maxW="600px">
            Дізнайтеся більше про ментальне здоров'я та способи його підтримки
          </Text>
        </VStack>

        {/* Articles Grid */}
        {loading ? (
          <Box textAlign="center" py={12}>
            <Spinner size="xl" color="#D32F2F" />
          </Box>
        ) : error ? (
          <Box textAlign="center" py={12} color="red.500">
            <Text>{error}</Text>
          </Box>
        ) : articles.length === 0 ? (
          <Box textAlign="center" py={12} color="gray.500">
            <Text>Статті відсутні</Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={16}>
            {articles.map(article => (
              <Card
                key={article.id}
                rounded="xl"
                overflow="hidden"
                boxShadow="sm"
                _hover={{ boxShadow: 'md', transform: 'translateY(-4px)' }}
                transition="all 0.3s"
                cursor="pointer"
                onClick={() => navigate(`/article/${article.id}`)}
              >
                <Box position="relative" h="200px" overflow="hidden">
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
                <CardBody>
                  <HStack mb={2} color="gray.500" fontSize="sm">
                    <Text>{article.readTime || '5 хв'}</Text>
                  </HStack>
                  <Heading as="h3" size="md" mb={3} color="gray.800">
                    {article.title}
                  </Heading>
                  <Text color="gray.600" fontSize="sm" mb={4} noOfLines={3}>
                    {article.description || ''}
                  </Text>
                  <Link
                    as={RouterLink}
                    to={`/article/${article.id}`}
                    color="#D32F2F"
                    fontWeight="semibold"
                    fontSize="sm"
                    _hover={{ color: '#B71C1C' }}
                  >
                    Читати більше →
                  </Link>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}

        {/* Statistics Section */}
        <Divider my={12} />
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} py={8}>
          <VStack spacing={2}>
            <Heading as="h2" fontSize="2xl" fontWeight="bold" color="#D32F2F">
              500+
            </Heading>
            <Text color="gray.700" fontSize="sm" textAlign="center">
              Кваліфікованих психологів
            </Text>
          </VStack>
          <VStack spacing={2}>
            <Heading as="h2" fontSize="2xl" fontWeight="bold" color="#D32F2F">
              15,000+
            </Heading>
            <Text color="gray.700" fontSize="sm" textAlign="center">
              Задоволених клієнтів
            </Text>
          </VStack>
          <VStack spacing={2}>
            <Heading as="h2" fontSize="2xl" fontWeight="bold" color="#D32F2F">
              98%
            </Heading>
            <Text color="gray.700" fontSize="sm" textAlign="center">
              Позитивних відгуків
            </Text>
          </VStack>
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default HomePage;
