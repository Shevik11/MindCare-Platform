import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import axios from 'axios';

const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      config => {
        const storedToken = localStorage.getItem('auth_token');
        if (storedToken) {
          config.headers.Authorization = `Bearer ${storedToken}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      response => {
        if (response.data?.token) {
          const newToken = response.data.token;
          const currentToken = localStorage.getItem('auth_token');

          if (newToken !== currentToken) {
            localStorage.setItem('auth_token', newToken);
            setToken(newToken);
            axios.defaults.headers.common['Authorization'] =
              `Bearer ${newToken}`;
          }
        }
        return response;
      },
      error => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          setToken(null);
          setUser(null);
          delete axios.defaults.headers.common['Authorization'];
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');

      if (storedToken) {
        setToken(storedToken);
        axios.defaults.headers.common['Authorization'] =
          `Bearer ${storedToken}`;

        try {
          const response = await axios.get('/api/auth/me');
          const userData = response.data;
          const userObj = {
            id: userData.id,
            email: userData.email,
            role: userData.role,
            firstName: userData.firstName,
            lastName: userData.lastName,
            photoUrl: userData.photoUrl,
          };
          setUser(userObj);
          localStorage.setItem('auth_user', JSON.stringify(userObj));

          if (userData.token && userData.token !== storedToken) {
            setToken(userData.token);
            localStorage.setItem('auth_token', userData.token);
            axios.defaults.headers.common['Authorization'] =
              `Bearer ${userData.token}`;
          }
        } catch (error) {
          console.error('Failed to load user data:', error);
          if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setToken(null);
            setUser(null);
            delete axios.defaults.headers.common['Authorization'];
          } else if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
            } catch {
              setUser(null);
            }
          }
        }
      } else if (storedUser) {
        localStorage.removeItem('auth_user');
        setUser(null);
      }
      setIsLoading(false);
    };

    loadUserData();
  }, []);

  const setAuthState = useCallback((nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser ?? null);
    if (nextToken) {
      localStorage.setItem('auth_token', nextToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${nextToken}`;
    } else {
      localStorage.removeItem('auth_token');
      delete axios.defaults.headers.common['Authorization'];
    }
    if (nextUser) {
      localStorage.setItem('auth_user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('auth_user');
    }
  }, []);

  const login = useCallback(
    async credentials => {
      const response = await axios.post('/api/auth/login', credentials);
      const { token: receivedToken, user: receivedUser } = response.data || {};
      setAuthState(receivedToken, receivedUser);
      return response.data;
    },
    [setAuthState]
  );

  const register = useCallback(
    async payload => {
      const response = await axios.post('/api/auth/register', payload);
      const { token: receivedToken, user: receivedUser } = response.data || {};
      setAuthState(receivedToken, receivedUser);
      return response.data;
    },
    [setAuthState]
  );

  const logout = useCallback(() => {
    setAuthState(null, null);
  }, [setAuthState]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    const refreshInterval = setInterval(
      async () => {
        try {
          const response = await axios.post('/api/auth/refresh');
          if (response.data?.token) {
            const newToken = response.data.token;
            setToken(newToken);
            localStorage.setItem('auth_token', newToken);
            axios.defaults.headers.common['Authorization'] =
              `Bearer ${newToken}`;
          }
        } catch (error) {
          console.error('Failed to refresh token periodically:', error);
          if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setToken(null);
            setUser(null);
            delete axios.defaults.headers.common['Authorization'];
          }
        }
      },
      24 * 60 * 60 * 1000
    );

    return () => clearInterval(refreshInterval);
  }, [token, user]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      register,
      logout,
    }),
    [user, token, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
