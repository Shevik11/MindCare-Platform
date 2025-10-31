import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Card,
  CardBody,
  CardFooter,
  SimpleGrid,
  Input,
  Select,
  Button,
  Flex,
  HStack,
  Stack,
  Badge,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb
} from '@chakra-ui/react';

const PsychologistsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [priceRange, setPriceRange] = useState([500, 1250]);
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/psychologists');
        setItems(res.data || []);
      } catch (e) {
        setError('Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const spec = specialization.trim().toLowerCase();
    return items.filter((p) => {
      const fullName = p.User ? `${p.User.firstName || ''} ${p.User.lastName || ''}`.toLowerCase() : '';
      const pSpec = (p.specialization || '').toLowerCase();
      const price = Number(p.price ?? 0);
      const rating = Number(p.rating ?? 0);
      const matchName = !s || fullName.includes(s);
      const matchSpec = !spec || pSpec.includes(spec);
      const matchPrice = price >= priceRange[0] && price <= priceRange[1];
      const matchRating = rating >= minRating;
      return matchName && matchSpec && matchPrice && matchRating;
    });
  }, [items, search, specialization, priceRange, minRating]);

  const specializationOptions = useMemo(() => {
    const set = new Set();
    items.forEach((p) => {
      if (p.specialization) set.add(p.specialization);
    });
    return Array.from(set);
  }, [items]);

  if (loading) return <Box p={6}>Loading...</Box>;
  if (error) return <Box p={6} color="red.500">{error}</Box>;

  return (
    <Box maxW="1200px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }}>
      <Box textAlign="center" py={{ base: 6, md: 10 }}>
        <Heading as="h1" fontSize={{ base: '2xl', md: '3xl' }} mb={3}>Знайдіть Свого Психолога</Heading>
        <Text color="gray.500" fontSize={{ base: 'sm', md: 'md' }}>Професійна підтримка ментального здоров'я від кваліфікованих спеціалістів</Text>
      </Box>

      <Box bg="white" border="1px" borderColor="gray.200" rounded="2xl" p={{ base: 4, md: 6 }} mb={10} boxShadow="sm">
        <HStack spacing={2} mb={5} color="gray.700">
          <Box color="red.500">🔍</Box>
          <Text fontWeight="semibold">Фільтри пошуку</Text>
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Box>
            <Text fontWeight="semibold" mb={2}>Спеціалізація</Text>
            <Select value={specialization} onChange={(e) => setSpecialization(e.target.value)} size="lg">
              <option value="">Усі спеціалізації</option>
              {specializationOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </Select>
          </Box>
          <Box>
            <Text fontWeight="semibold" mb={3}>Ціна: {priceRange[0]} - {priceRange[1]} грн</Text>
            <RangeSlider min={0} max={2000} step={50} value={priceRange} onChange={setPriceRange} colorScheme="red" mt={4}>
              <RangeSliderTrack h="14px" borderRadius="full">
                <RangeSliderFilledTrack />
              </RangeSliderTrack>
              <RangeSliderThumb index={0} boxSize={5} bg="white" borderRadius="full" border="2px solid" borderColor="red.500" />
              <RangeSliderThumb index={1} boxSize={5} bg="white" borderRadius="full" border="2px solid" borderColor="red.500" />
            </RangeSlider>
          </Box>
          <Box>
            <Text fontWeight="semibold" mb={2}>Мінімальний рейтинг</Text>
            <Select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} size="lg">
              <option value={0}>Усі рейтинги</option>
              <option value={3}>3+</option>
              <option value={4}>4+</option>
              <option value={4.5}>4.5+</option>
              <option value={5}>5</option>
            </Select>
          </Box>
        </SimpleGrid>
        <HStack mt={6} spacing={4}>
          <Button
            size="lg"
            h="48px"
            px={6}
            borderRadius="12px"
            bg="#D32F2F"
            _hover={{ bg: '#B71C1C' }}
            color="white"
          >
            Застосувати фільтри
          </Button>
          <Button
            size="lg"
            h="48px"
            px={6}
            borderRadius="12px"
            variant="outline"
            bg="white"
            borderColor="gray.300"
            color="black"
            _hover={{ bg: 'gray.50' }}
            onClick={() => { setSearch(''); setSpecialization(''); setPriceRange([0,2000]); setMinRating(0); }}
          >
            Скинути
          </Button>
        </HStack>
      </Box>

      <Heading as="h3" size="md" mb={5}>Знайдено {filtered.length} психологів</Heading>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={6}>
        {filtered.map((p) => {
          const name = p.User ? `${p.User.firstName || ''} ${p.User.lastName || ''}`.trim() || 'Психолог' : 'Психолог';
          return (
            <Card key={p.id} variant="outline" rounded="2xl" boxShadow="sm" _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }} transition="all .2s ease">
              <CardBody textAlign="center" pb={0}>
                <Box w="96px" h="96px" bg="gray.100" rounded="full" mx="auto" mb={3} />
                <Heading as="h4" size="md" mb={1}>{name}</Heading>
                <Text color="gray.600" mb={2}>Досвід: {p.experience} років</Text>
                <HStack justify="center" spacing={2} mb={2}>
                  {p.specialization && <Badge colorScheme="purple" rounded="full">{p.specialization}</Badge>}
                </HStack>
                <HStack justify="center" spacing={2}>
                  <Text color="red.500">★★★★★</Text>
                  <Text color="gray.600">({p.rating ?? '5.0'})</Text>
                </HStack>
                {p.price != null && <Text mt={2} fontWeight="semibold">{p.price} грн / сесія</Text>}
              </CardBody>
              <CardFooter>
                <Button as={Link} to={`/psychologist/${p.id}`} colorScheme="red" w="full">Переглянути Профіль</Button>
              </CardFooter>
            </Card>
          );
        })}
      </SimpleGrid>
      {filtered.length === 0 && <Box mt={4}>Нічого не знайдено</Box>}
    </Box>
  );
};

export default PsychologistsPage;


