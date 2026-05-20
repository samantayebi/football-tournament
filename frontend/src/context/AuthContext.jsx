import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext  = createContext(null);
const ThemeContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [theme, setTheme] = useState('light');

  const login       = (t) => setToken(t);
  const logout      = ()  => setToken(null);
  const toggleTheme = ()  => setTheme(t => t === 'light' ? 'dark' : 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        {children}
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}

export function useAuth()  { return useContext(AuthContext); }
export function useTheme() { return useContext(ThemeContext); }
