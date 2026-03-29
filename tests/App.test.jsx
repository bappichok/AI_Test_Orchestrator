import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App.jsx';

describe('App Shell Integration', () => {
  it('renders the Dashboard by default and shows the Sidebar', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    
    // Check if branding is present
    expect(screen.getByText('TestOrchestrator')).toBeInTheDocument();
    
    // Check if Sidebar links are visible
    expect(screen.getByText('Fetch Story')).toBeInTheDocument();
    expect(screen.getByText('Create Plan')).toBeInTheDocument();
  });
});
