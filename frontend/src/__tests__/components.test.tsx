import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => React.createElement('img', props),
}));

vi.mock('../lib/api', () => ({
  searchText: vi.fn().mockResolvedValue({ results: [{ id: '1', name: 'Test Loft', picture_url: 'https://example.com/1.jpg', price: '$100', neighborhood: 'Downtown', city: 'Boston' }] }),
  searchImage: vi.fn(),
  searchSimilar: vi.fn(),
  cancelActiveRequests: vi.fn(),
}));

import Header from '../app/components/Header';
import Toast from '../app/components/Toast';
import ErrorBoundary from '../app/components/ErrorBoundary';
import ListingCard from '../app/components/ListingCard';

describe('Header', () => {
  it('renders the brand name', () => {
    render(React.createElement(Header));
    expect(screen.getByText('airbnb')).toBeTruthy();
    expect(screen.getByText('lens')).toBeTruthy();
  });

  it('renders navigation links', () => {
    render(React.createElement(Header));
    expect(screen.getByText('Stays')).toBeTruthy();
    expect(screen.getByText('Experiences')).toBeTruthy();
  });

  it('shows mini search when scrolled', () => {
    render(React.createElement(Header, { showMiniSearch: true, currentCity: 'Boston' }));
    expect(screen.getByText('Boston')).toBeTruthy();
    expect(screen.getByText('Any aesthetic')).toBeTruthy();
  });
});

describe('Toast', () => {
  it('renders error message', () => {
    render(React.createElement(Toast, { message: 'Something failed', onDismiss: () => {} }));
    expect(screen.getByText('Something failed')).toBeTruthy();
  });

  it('calls onDismiss when close clicked', () => {
    let dismissed = false;
    render(React.createElement(Toast, { message: 'Error', onDismiss: () => { dismissed = true; } }));
    screen.getByRole('button').click();
    expect(dismissed).toBe(true);
  });
});

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      React.createElement(ErrorBoundary, null,
        React.createElement('span', null, 'Safe content')
      )
    );
    expect(screen.getByText('Safe content')).toBeTruthy();
  });

  it('renders fallback UI on error', () => {
    const Bomb = () => { throw new Error('Boom'); };
    render(
      React.createElement(ErrorBoundary, null,
        React.createElement(Bomb)
      )
    );
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Try Again')).toBeTruthy();
  });
});

describe('ListingCard', () => {
  const listing = {
    id: '42',
    name: 'Sunny Apartment',
    picture_url: 'https://example.com/img.jpg',
    price: '$150',
    neighborhood: 'Midtown',
    city: 'New York',
    description: '<p>Beautiful <b>sunny</b> apartment</p>',
    latitude: 40.7128,
    longitude: -74.006,
  };

  it('renders neighborhood and city', () => {
    render(
      React.createElement(ListingCard, {
        listing,
        CITIES: ['New York', 'Boston'],
        onStyleMigrate: () => {},
      })
    );
    expect(screen.getByText('Midtown')).toBeTruthy();
    expect(screen.getByText('New York')).toBeTruthy();
  });

  it('renders price', () => {
    render(
      React.createElement(ListingCard, {
        listing,
        CITIES: ['New York', 'Boston'],
        onStyleMigrate: () => {},
      })
    );
    expect(screen.getByText('$150')).toBeTruthy();
  });

  it('strips HTML from description', () => {
    render(
      React.createElement(ListingCard, {
        listing,
        CITIES: ['New York', 'Boston'],
        onStyleMigrate: () => {},
      })
    );
    expect(screen.getByText('Beautiful sunny apartment')).toBeTruthy();
  });

  it('renders match score badge', () => {
    render(
      React.createElement(ListingCard, {
        listing,
        CITIES: ['New York', 'Boston'],
        onStyleMigrate: () => {},
      })
    );
    expect(screen.getByText(/% match/)).toBeTruthy();
  });

  it('has a favorite heart button', () => {
    render(
      React.createElement(ListingCard, {
        listing,
        CITIES: ['New York', 'Boston'],
        onStyleMigrate: () => {},
      })
    );
    const heartBtn = screen.getAllByRole('button')[0];
    expect(heartBtn).toBeTruthy();
  });
});
