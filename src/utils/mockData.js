export const MOCK_STORIES = {
  'DEMO-1': {
    id: 'DEMO-1', title: 'User Login with Email and Password',
    description: 'As a registered user, I want to log in using my email and password so that I can access my account dashboard and personalized settings.',
    acceptance_criteria: [
      'Email must be in valid format (user@domain.com)',
      'Password minimum 8 characters with at least one uppercase and one number',
      'User is locked out after 5 consecutive failed login attempts',
      'Successful login redirects to Dashboard',
      'Session expires after 30 minutes of inactivity',
      'Remember Me option extends session to 30 days'
    ],
    priority: 'High', type: 'Story', epic: 'Authentication',
    labels: ['auth', 'login', 'security'],
    status: 'In Progress', assignee: 'Jane Smith', reporter: 'Product Owner',
    flags: []
  },
  'DEMO-2': {
    id: 'DEMO-2', title: 'Password Reset via Email',
    description: 'User can reset password.',
    acceptance_criteria: [],
    priority: 'Medium', type: 'Story', epic: 'Authentication',
    labels: ['auth', 'password'],
    status: 'Backlog', assignee: 'Unassigned', reporter: 'QA Lead',
    flags: ['MISSING_AC', 'VAGUE_DESC']
  },
  'DEMO-3': {
    id: 'DEMO-3', title: 'Product Search with Filters',
    description: 'As a shopper, I want to search for products using keywords and apply filters (category, price range, brand, rating) so I can quickly find relevant items.',
    acceptance_criteria: [
      'Search returns results within 500ms',
      'Filters can be combined (AND logic)',
      'No results state shows suggestions',
      'Search is case-insensitive',
      'Minimum 3 characters required to trigger search'
    ],
    priority: 'Critical', type: 'Story', epic: 'Product Catalog',
    labels: ['search', 'frontend', 'performance'],
    status: 'Ready for QA', assignee: 'Bob Johnson', reporter: 'Product Manager',
    flags: []
  }
}
