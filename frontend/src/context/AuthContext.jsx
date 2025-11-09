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

  // Load user data from server if token exists
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken) {
      setToken(storedToken);
      // Set Authorization header before making the request
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

      // Load user data from server to ensure it's up to date
      axios
        .get('/api/auth/me')
        .then(response => {
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
          console.log('User data loaded from server:', userObj);
        })
        .catch(error => {
          console.error('Failed to load user data:', error);
          // If token is invalid, clear it
          if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setToken(null);
            setUser(null);
            delete axios.defaults.headers.common['Authorization'];
          } else if (storedUser) {
            // Fallback to stored user if server request fails (e.g., network error)
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
              console.log('Using stored user data:', parsedUser);
            } catch {
              setUser(null);
            }
          }
        });
    } else if (storedUser) {
      // If no token but user exists in storage, clear it
      localStorage.removeItem('auth_user');
      setUser(null);
    }
  }, []);

  const setAuthState = useCallback((nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser ?? null);
    if (nextToken) localStorage.setItem('auth_token', nextToken);
    else localStorage.removeItem('auth_token');
    if (nextUser) localStorage.setItem('auth_user', JSON.stringify(nextUser));
    else localStorage.removeItem('auth_user');
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
    if (token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete axios.defaults.headers.common['Authorization'];
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
    }),
    [user, token, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
