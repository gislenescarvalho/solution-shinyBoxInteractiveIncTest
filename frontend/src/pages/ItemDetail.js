import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { useTheme } from '../state/ThemeContext';

const Container = styled.div`
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
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

const ErrorMessage = styled.div`
  padding: 16px;
  background-color: ${props => props.theme.colors.errorBg};
  border: 1px solid ${props => props.theme.colors.errorBorder};
  border-radius: 8px;
  color: ${props => props.theme.colors.error};
  margin-bottom: 16px;
  font-weight: 500;
`;

const ItemInfo = styled.div`
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px ${props => props.theme.colors.shadow};
`;

const ItemName = styled.h2`
  color: ${props => props.theme.colors.text};
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 600;
`;

const ItemDetail = styled.p`
  color: ${props => props.theme.colors.text};
  margin: 8px 0;
  font-size: 16px;
  line-height: 1.5;
`;

const Label = styled.strong`
  color: ${props => props.theme.colors.primary};
  margin-right: 8px;
`;

function ItemDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    let isMounted = true;

    const fetchItem = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/items/${id}`);
        
        if (!response.ok) {
          throw new Error('Item not found');
        }
        
        const data = await response.json();
        if (isMounted) {
          setItem(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setTimeout(() => navigate('/'), 2000);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchItem();

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingSpinner theme={theme} aria-label="Loading item" />
        </LoadingContainer>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage theme={theme} role="alert">
          {error}
        </ErrorMessage>
      </Container>
    );
  }

  if (!item) return null;

  return (
    <Container>
      <ItemInfo theme={theme}>
        <ItemName theme={theme}>{item.name}</ItemName>
        <ItemDetail theme={theme}>
          <Label theme={theme}>Category:</Label> {item.category}
        </ItemDetail>
        <ItemDetail theme={theme}>
          <Label theme={theme}>Price:</Label> ${item.price.toFixed(2)}
        </ItemDetail>
        <ItemDetail theme={theme}>
          <Label theme={theme}>Description:</Label> {item.description}
        </ItemDetail>
      </ItemInfo>
    </Container>
  );
}

export default ItemDetailPage;