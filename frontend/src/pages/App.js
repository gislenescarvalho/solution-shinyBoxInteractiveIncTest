import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Items from './Items';
import ItemDetail from './ItemDetail';
import { DataProvider } from '../state/DataContext';
import { ThemeProvider, useTheme } from '../state/ThemeContext';
import styled from '@emotion/styled';

const ThemeToggle = styled.button`
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.background};
  z-index: 1000;

  &:hover {
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const Nav = styled.nav`
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
`;

const StyledLink = styled(Link)`
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const AppContent = () => {
  const { theme, toggleTheme, currentTheme } = useTheme();

  return (
    <div style={{ 
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      minHeight: '100vh'
    }}>
      <ThemeToggle onClick={toggleTheme}>
        {currentTheme === 'light' ? '🌙 Dark Mode' : 
         currentTheme === 'dark' ? '🎨 High Contrast' : 
         '☀️ Light Mode'}
      </ThemeToggle>
      <Nav>
        <StyledLink to="/">Home</StyledLink>
      </Nav>
      <Routes>
        <Route path="/" element={<Items />} />
        <Route path="/items/:id" element={<ItemDetail />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;