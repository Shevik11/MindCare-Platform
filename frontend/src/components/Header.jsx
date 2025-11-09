import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  Spacer,
  Button,
  HStack,
  Text,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const isAuthPage =
    location.pathname === '/login' || location.pathname === '/register';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Box
      bg="white"
      borderBottom="1px"
      borderColor="gray.200"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Flex maxW="1200px" mx="auto" py={3} px={4} align="center">
        <Heading
          as={Link}
          to="/"
          size="md"
          color="red.600"
          textDecoration="none"
        >
          MindCare Platform
        </Heading>
        <Spacer />
        {!isAuthPage && (
          <Flex gap={3} align="center">
            <Button
              as={Link}
              to="/psychologists"
              size="md"
              h="42px"
              px={5}
              borderRadius="10px"
              variant="ghost"
              color="gray.700"
              _hover={{ bg: 'gray.100' }}
            >
              Психологи
            </Button>
            {isAuthenticated ? (
              <HStack spacing={4}>
                <Text color="gray.700">
                  {user?.firstName} {user?.lastName}
                </Text>
                {user?.role === 'admin' && (
                  <Button
                    as={Link}
                    to="/admin"
                    size="md"
                    h="42px"
                    px={5}
                    borderRadius="10px"
                    variant="ghost"
                    color="gray.700"
                    _hover={{ bg: 'gray.100' }}
                  >
                    <HStack spacing={2}>
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
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <Text>Адмін</Text>
                    </HStack>
                  </Button>
                )}
                {user?.role === 'patient' && (
                  <Button
                    as={Link}
                    to="/appointments/my"
                    size="md"
                    h="42px"
                    px={5}
                    borderRadius="10px"
                    variant="ghost"
                    color="gray.700"
                    _hover={{ bg: 'gray.100' }}
                  >
                    Мої записи
                  </Button>
                )}
                {user?.role === 'psychologist' && (
                  <>
                    <Button
                      as={Link}
                      to="/articles/my"
                      size="md"
                      h="42px"
                      px={5}
                      borderRadius="10px"
                      variant="ghost"
                      color="gray.700"
                      _hover={{ bg: 'gray.100' }}
                    >
                      Мої статті
                    </Button>
                    <Button
                      as={Link}
                      to="/appointments/psychologist"
                      size="md"
                      h="42px"
                      px={5}
                      borderRadius="10px"
                      variant="ghost"
                      color="gray.700"
                      _hover={{ bg: 'gray.100' }}
                    >
                      Записи
                    </Button>
                  </>
                )}
                <Button
                  as={Link}
                  to="/profile"
                  size="md"
                  h="42px"
                  px={5}
                  borderRadius="10px"
                  variant="ghost"
                  color="gray.700"
                  _hover={{ bg: 'gray.100' }}
                >
                  Мій профіль
                </Button>
                <Button
                  onClick={handleLogout}
                  size="md"
                  h="42px"
                  px={5}
                  borderRadius="10px"
                  variant="ghost"
                  color="gray.700"
                  _hover={{ bg: 'gray.100' }}
                >
                  Вийти
                </Button>
              </HStack>
            ) : (
              <>
                <Button
                  as={Link}
                  to="/login"
                  size="md"
                  h="42px"
                  px={5}
                  borderRadius="10px"
                  variant="outline"
                  bg="white"
                  borderColor="gray.300"
                  color="black"
                  _hover={{ bg: 'gray.50' }}
                >
                  Вхід
                </Button>
                <Button
                  as={Link}
                  to="/register"
                  size="md"
                  h="42px"
                  px={5}
                  borderRadius="10px"
                  bg="#D32F2F"
                  _hover={{ bg: '#B71C1C' }}
                  color="white"
                >
                  Реєстрація
                </Button>
              </>
            )}
          </Flex>
        )}
      </Flex>
    </Box>
  );
};

export default Header;
