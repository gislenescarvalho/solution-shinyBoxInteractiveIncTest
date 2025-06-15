import React, { useEffect, useState, useCallback } from 'react';
import { useData } from '../state/DataContext';
import { useTheme } from '../state/ThemeContext';
import { Link } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import styled from '@emotion/styled';

// Global styles for typography
const GlobalStyles = styled.div`
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
`;

// Styled components for layout and UI elements
const Container = styled(GlobalStyles)`
  padding: 20px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SearchContainer = styled.div`
  position: relative;
  max-width: 80%;
`;

const SearchInput = styled.input`
  padding: 12px 16px;
  padding-right: 40px;
  width: 100%;
  font-size: 16px;
  font-family: inherit;
  border-radius: 8px;
  border: 2px solid ${props => props.theme.colors.border};
  transition: all 0.2s ease;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.shadow};
  }

  &::placeholder {
    color: ${props => props.theme.colors.secondary};
    font-family: inherit;
  }
`;

const SearchSpinner = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: 2px solid ${props => props.theme.colors.loading};
  border-top: 2px solid ${props => props.theme.colors.loadingActive};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  opacity: ${props => props.isSearching ? 1 : 0};
  transition: opacity 0.2s ease;

  @keyframes spin {
    0% { transform: translateY(-50%) rotate(0deg); }
    100% { transform: translateY(-50%) rotate(360deg); }
  }
`;

const SearchResults = styled.div`
  margin-top: 8px;
  font-size: 12px;
  width: 100%;
  color: ${props => props.theme.colors.secondary};
  font-weight: 500;
  text-align: left;
`;

const ListContainer = styled.div`
  height: 400px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  overflow-x: hidden;
  background: ${props => props.theme.colors.background};
  box-shadow: 0 2px 4px ${props => props.theme.colors.shadow};
  width: 100%;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 16px;
  background: ${props => props.theme.colors.background};
  border-radius: 8px;
  box-shadow: 0 2px 4px ${props => props.theme.colors.shadow};
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  font-family: inherit;
  font-size: 14px;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => {
    if (props.disabled) {
      switch (props.theme.name) {
        case 'light':
          return '#cccccc';  // Medium gray for light mode
        case 'dark':
          return '#404040';  // Dark gray for dark mode
        case 'highContrast':
          return '#333333';  // Very dark gray for high contrast
        default:
          return props.theme.colors.border;
      }
    }
    switch (props.theme.name) {
      case 'light':
        return '#004494';  // Dark blue for light mode
      case 'dark':
        return '#0d6efd';  // Bright blue for dark mode
      case 'highContrast':
        return '#ffff00';  // Yellow for high contrast
      default:
        return props.theme.colors.primary;
    }
  }};
  color: ${props => {
    if (props.disabled) {
      switch (props.theme.name) {
        case 'light':
          return '#666666';  // Dark gray text for light mode
        case 'dark':
          return '#808080';  // Medium gray text for dark mode
        case 'highContrast':
          return '#ffffff';  // White text for high contrast
        default:
          return props.theme.colors.secondary;
      }
    }
    switch (props.theme.name) {
      case 'light':
        return '#ffffff';  // White text for light mode
      case 'dark':
        return '#ffffff';  // White text for dark mode
      case 'highContrast':
        return '#000000';  // Black text for high contrast
      default:
        return props.theme.colors.background;
    }
  }};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.7 : 1};

  &:hover:not(:disabled) {
    background-color: ${props => {
      switch (props.theme.name) {
        case 'light':
          return '#003366';  // Darker blue for light mode
        case 'dark':
          return '#0b5ed7';  // Slightly darker blue for dark mode
        case 'highContrast':
          return '#ffff00';  // Keep yellow for high contrast
        default:
          return props.theme.colors.primary;
      }
    }};
    transform: translateY(-1px);
    box-shadow: 0 2px 4px ${props => props.theme.colors.shadow};
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: none;
  }
`;

const PageInfo = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.colors.secondary};
  letter-spacing: 0.2px;
`;

const ErrorMessage = styled.div`
  padding: 16px;
  background-color: ${props => props.theme.colors.errorBg};
  border: 1px solid ${props => props.theme.colors.errorBorder};
  border-radius: 8px;
  color: ${props => props.theme.colors.error};
  margin-bottom: 16px;
  font-weight: 500;
`;

const LoadingContainer = styled.div`
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.background};
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.border};
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${props => props.theme.colors.loading};
  border-top: 3px solid ${props => props.theme.colors.loadingActive};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Skeleton loader component for loading state
const SkeletonRow = styled.div`
  padding: 12px;
  border-bottom: 1px solid #eee;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;

  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

// Item row component for react-window virtualization
const ItemRow = ({ index, style, data }) => {
  const { theme } = useTheme();
  const item = data.items[index];
  
  return (
    <div
      style={{
        ...style,
        borderBottom: `1px solid ${theme.colors.border}`,
        transition: 'background-color 0.2s',
        height: 'auto',
        minHeight: '50px',
        display: 'flex',
        alignItems: 'center'
      }}
      role="listitem"
    >
      <Link 
        to={'/items/' + item.id}
        style={{ 
          textDecoration: 'none',
          color: theme.colors.text,
          display: 'block',
          padding: '12px 16px',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
          fontSize: '14px',
          fontWeight: 500,
          letterSpacing: '0.2px',
          width: '100%'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.hover}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        {item.name}
      </Link>
    </div>
  );
};

function Items() {
  const { items, metadata, loading, error, fetchItems } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search query with improved UX
  useEffect(() => {
    if (searchQuery !== debouncedQuery) {
      setIsSearching(true);
    }

    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, 500); // Increased debounce time for better UX

    return () => {
      clearTimeout(timer);
      setIsSearching(false);
    };
  }, [searchQuery, debouncedQuery]);

  // Fetch items when page or search query changes
  useEffect(() => {
    let isMounted = true;

    const loadItems = async () => {
      try {
        await fetchItems(metadata.currentPage, debouncedQuery);
      } catch (error) {
        console.error('Error fetching items:', error);
      }
    };

    if (isMounted) {
      loadItems();
    }

    return () => {
      isMounted = false;
    };
  }, [fetchItems, metadata.currentPage, debouncedQuery]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= metadata.totalPages) {
      fetchItems(newPage, debouncedQuery);
    }
  }, [fetchItems, metadata.totalPages, debouncedQuery]);

  if (error) {
    return (
      <Container>
        <ErrorMessage role="alert">
          Error: {error}
        </ErrorMessage>
      </Container>
    );
  }

  return (
    <Container>
      <SearchContainer>
        <SearchInput
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search items"
        />
        <SearchSpinner isSearching={isSearching} aria-label="Searching" />
        {!loading && !isSearching && (
          <SearchResults>
            {items.length === 0 
              ? 'No items found' 
              : `Found ${metadata.totalItems} item${metadata.totalItems !== 1 ? 's' : ''}`
            }
          </SearchResults>
        )}
      </SearchContainer>

      {loading ? (
        <LoadingContainer>
          <LoadingSpinner aria-label="Loading items" />
        </LoadingContainer>
      ) : (
        <>
          <ListContainer>
            <List
              height={400}
              itemCount={items.length}
              itemSize={50}
              width="100%"
              itemData={{ items }}
              role="list"
              aria-label="Items list"
            >
              {ItemRow}
            </List>
          </ListContainer>

          <PaginationContainer>
            <Button
              onClick={() => handlePageChange(metadata.currentPage - 1)}
              disabled={metadata.currentPage === 1}
              aria-label="Previous page"
            >
              Previous
            </Button>

            <PageInfo>
              Page {metadata.currentPage} of {metadata.totalPages}
            </PageInfo>

            <Button
              onClick={() => handlePageChange(metadata.currentPage + 1)}
              disabled={metadata.currentPage === metadata.totalPages}
              aria-label="Next page"
            >
              Next
            </Button>
          </PaginationContainer>
        </>
      )}
    </Container>
  );
}

export default Items;