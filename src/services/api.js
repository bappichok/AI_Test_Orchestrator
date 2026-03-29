import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const connectionService = {
  test: (type, config) => api.post('/connections/test', { type, config }),
};

export const jiraService = {
  fetch: (issueId, config) => api.post('/jira/fetch', { issueId, ...config }),
};

export const adoService = {
  fetch: (workItemId, config) => api.post('/ado/fetch', { workItemId, ...config }),
};

export const generateService = {
  testPlan: (story, settings) => api.post('/generate/test-plan', { story, settings }),
  testCases: (story, settings) => api.post('/generate/test-cases', { story, settings }),
  code: (testCases, framework, settings) => api.post('/generate/code', { testCases, framework, settings }),
};

export default api;
