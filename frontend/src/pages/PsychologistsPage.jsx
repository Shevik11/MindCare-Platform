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
  Select,
  Button,
  HStack,
  Badge,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Avatar,
} from '@chakra-ui/react';

const PsychologistsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/psychologists');
        console.log('Loaded psychologists:', res.data);
        console.log('First psychologist structure:', res.data?.[0]);
        console.log('User data in first psychologist:', res.data?.[0]?.User);
        setItems(res.data || []);
      } catch (e) {
        console.error('Failed to load psychologists:', e);
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
    console.log('Filtering with:', {
      s,
      spec,
      priceRange,
      minRating,
      itemsCount: items.length,
    });
    const result = items.filter(p => {
      const fullName = p.User
        ? `${p.User.firstName || ''} ${p.User.lastName || ''}`.toLowerCase()
        : '';
      const pSpec = (p.specialization || '').toLowerCase();
      // Price should already be converted to number on backend, but handle edge cases
      const price = p.price != null ? Number(p.price) : 0;
      // Note: rating is not stored in psychologists table, it should be calculated from comments
      // For now, we'll skip rating filter or assume all have rating >= minRating
      const matchName = !s || fullName.includes(s);
      const matchSpec = !spec || pSpec.includes(spec);
      // If price is 0, null, undefined, or NaN, allow it (treat as 0, which should be in range [0, 2000])
      const matchPrice =
        !price ||
        isNaN(price) ||
        (price >= priceRange[0] && price <= priceRange[1]);
      // Skip rating filter for now since rating is not in the table
      const matchRating = true; // TODO: Calculate rating from comments
      const passed = matchName && matchSpec && matchPrice && matchRating;

      if (!passed) {
        console.log('Filtered out psychologist:', {
          id: p.id,
          fullName,
          pSpec,
          price,
          matchName,
          matchSpec,
          matchPrice,
          matchRating,
          search: s,
          specialization: spec,
          priceRange,
        });
      }

      return passed;
    });
    console.log(`Filtered ${result.length} of ${items.length} psychologists`);
    if (result.length === 0 && items.length > 0) {
      console.log('All psychologists filtered out. First item:', items[0]);
    }
    return result;
  }, [items, search, specialization, priceRange, minRating]);

  const specializationOptions = useMemo(() => {
    const set = new Set();
    for (const p of items) {
      if (p.specialization) set.add(p.specialization);
    }
    return Array.from(set);
  }, [items]);

  if (loading) return <Box p={6}>Loading...</Box>;
  if (error)
    return (
      <Box p={6} color="red.500">
        {error}
      </Box>
    );

  return (
    <Box
      maxW="1200px"
      mx="auto"
      px={{ base: 4, md: 6 }}
      py={{ base: 6, md: 10 }}
    >
      <Box textAlign="center" py={{ base: 6, md: 10 }}>
        <Heading as="h1" fontSize={{ base: '2xl', md: '3xl' }} mb={3}>
          Знайдіть Свого Психолога
        </Heading>
        <Text color="gray.500" fontSize={{ base: 'sm', md: 'md' }}>
          Професійна підтримка ментального здоров'я від кваліфікованих
          спеціалістів
        </Text>
      </Box>

      <Box
        bg="white"
        border="1px"
        borderColor="gray.200"
        rounded="2xl"
        p={{ base: 4, md: 6 }}
        mb={10}
        boxShadow="sm"
      >
        <HStack spacing={2} mb={5} color="gray.700">
          <Box color="red.500" w={5} h={5}>
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </Box>
          <Text fontWeight="semibold">Фільтри пошуку</Text>
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Box>
            <Text fontWeight="semibold" mb={2}>
              Спеціалізація
            </Text>
            <Select
              value={specialization}
              onChange={e => setSpecialization(e.target.value)}
              size="lg"
            >
              <option value="">Усі спеціалізації</option>
              {specializationOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          </Box>
          <Box>
            <Text fontWeight="semibold" mb={3}>
              Ціна: {priceRange[0]} - {priceRange[1]} грн
            </Text>
            <RangeSlider
              min={0}
              max={2000}
              step={50}
              value={priceRange}
              onChange={setPriceRange}
              colorScheme="red"
              mt={4}
            >
              <RangeSliderTrack h="14px" borderRadius="full">
                <RangeSliderFilledTrack />
              </RangeSliderTrack>
              <RangeSliderThumb
                index={0}
                boxSize={5}
                bg="white"
                borderRadius="full"
                border="2px solid"
                borderColor="red.500"
              />
              <RangeSliderThumb
                index={1}
                boxSize={5}
                bg="white"
                borderRadius="full"
                border="2px solid"
                borderColor="red.500"
              />
            </RangeSlider>
          </Box>
          <Box>
            <Text fontWeight="semibold" mb={2}>
              Мінімальний рейтинг
            </Text>
            <Select
              value={minRating}
              onChange={e => setMinRating(Number(e.target.value))}
              size="lg"
            >
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
            onClick={() => {
              setSearch('');
              setSpecialization('');
              setPriceRange([0, 2000]);
              setMinRating(0);
            }}
          >
            Скинути
          </Button>
        </HStack>
      </Box>

      <Heading as="h3" size="md" mb={5}>
        Знайдено {filtered.length} психологів
      </Heading>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={6}>
        {filtered.map(p => {
          const name = p.User
            ? `${p.User.firstName || ''} ${p.User.lastName || ''}`.trim() ||
              'Психолог'
            : 'Психолог';
          return (
            <Card
              key={p.id}
              variant="outline"
              rounded="2xl"
              boxShadow="sm"
              _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
              transition="all .2s ease"
            >
              <CardBody textAlign="center" pb={0}>
                <Avatar
                  size="lg"
                  src={
                    p.User?.photoUrl
                      ? `http://localhost:5000${p.User.photoUrl}`
                      : null
                  }
                  mx="auto"
                  mb={3}
                />
                <Heading as="h4" size="md" mb={1}>
                  {name}
                </Heading>
                <Text color="gray.600" mb={2}>
                  Досвід: {p.experience} років
                </Text>
                <HStack justify="center" spacing={2} mb={2}>
                  {p.specialization && (
                    <Badge colorScheme="purple" rounded="full">
                      {p.specialization}
                    </Badge>
                  )}
                </HStack>
                <HStack justify="center" spacing={2}>
                  <Text color="red.500">★★★★★</Text>
                  <Text color="gray.600">(5.0)</Text>
                </HStack>
                {p.price != null && Number(p.price) > 0 && (
                  <Text mt={2} fontWeight="semibold">
                    {Number(p.price)} грн / сесія
                  </Text>
                )}
              </CardBody>
              <CardFooter>
                <Button
                  as={Link}
                  to={`/psychologist/${p.id}`}
                  size="lg"
                  h="48px"
                  w="full"
                  borderRadius="12px"
                  bg="#D32F2F"
                  _hover={{ bg: '#B71C1C' }}
                  color="white"
                >
                  Переглянути Профіль
                </Button>
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
