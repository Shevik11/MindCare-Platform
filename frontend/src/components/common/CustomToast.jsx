import React from 'react';
import { Box, Text, IconButton } from '@chakra-ui/react';

const CustomToast = ({ title, onClose, status = 'success' }) => {
  // Determine colors based on status
  const getColors = () => {
    switch (status) {
      case 'error':
        return {
          borderColor: '#E53E3E',
          textColor: '#E53E3E',
          hoverBg: '#E53E3E',
        };
      case 'warning':
        return {
          borderColor: '#ED8936',
          textColor: '#ED8936',
          hoverBg: '#ED8936',
        };
      case 'info':
        return {
          borderColor: '#D32F2F',
          textColor: '#D32F2F',
          hoverBg: '#D32F2F',
        };
      default: // success
        return {
          borderColor: '#D32F2F',
          textColor: '#D32F2F',
          hoverBg: '#D32F2F',
        };
    }
  };

  const colors = getColors();

  return (
    <Box
      px={5}
      py={2.5}
      bg="white"
      border="1px"
      borderColor={colors.borderColor}
      borderRadius="full"
      boxShadow="md"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      gap={3}
      mx="auto"
      maxW="700px"
      minW="300px"
    >
      <Text
        color={colors.textColor}
        fontWeight="medium"
        fontSize="md"
        flex="1"
        textAlign="left"
        noOfLines={2}
      >
        {title}
      </Text>
      <IconButton
        aria-label="Закрити"
        onClick={onClose}
        variant="ghost"
        size="sm"
        minW="32px"
        w="32px"
        h="32px"
        p={0}
        color={colors.textColor}
        borderRadius="full"
        flexShrink={0}
        _hover={{ bg: colors.hoverBg, color: 'white' }}
        icon={
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="4" y1="4" x2="14" y2="14" />
            <line x1="14" y1="4" x2="4" y2="14" />
          </svg>
        }
      />
    </Box>
  );
};

export default CustomToast;
