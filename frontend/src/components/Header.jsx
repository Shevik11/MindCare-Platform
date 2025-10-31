import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Flex, Heading, Spacer, Button } from '@chakra-ui/react';

const Header = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <Box bg="white" borderBottom="1px" borderColor="gray.200" position="sticky" top={0} zIndex={10}>
      <Flex maxW="1200px" mx="auto" py={3} px={4} align="center">
        <Heading as={Link} to="/psychologists" size="md" color="red.600" textDecoration="none">
          MindCare Platform
        </Heading>
        <Spacer />
        {!isAuthPage && (
          <Flex gap={3} align="center">
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
          </Flex>
        )}
      </Flex>
    </Box>
  );
};

export default Header;


