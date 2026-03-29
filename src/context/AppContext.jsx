import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './Toast';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { addToast } = useToast();
  const [connections, setConnections] = useState({});
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [llmLabel, setLlmLabel] = useState('OpenAI GPT-4o');

  // Load connections on mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('connections') || '{}');
    setConnections(saved);
  }, []);

  // Update LLM Label whenever connections change
  useEffect(() => {
    const llm = connections.llm || {};
    let label = 'OpenAI GPT-4o';
    
    if (llm.provider === 'openai') label = 'OpenAI GPT-4o';
    else if (llm.provider === 'anthropic') label = 'Claude 3.5 Sonnet';
    else if (llm.provider === 'groq') label = `Groq: ${llm.groqModel || 'llama-3.3-70b-versatile'}`;
    else if (llm.provider === 'ollama') label = `Ollama: ${llm.ollamaModel || 'llama3'}`;
    else if (llm.provider === 'gemini') label = `Gemini: ${llm.geminiModel || 'gemini-1.5-flash'}`;
    else if (llm.provider === 'custom') label = `Custom API: ${llm.customModel || 'local-model'}`;
    
    setLlmLabel(label);
  }, [connections]);

  // Sync theme with DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const updateConnection = useCallback((id, config) => {
    setConnections(prev => {
      const next = { ...prev, [id]: { ...prev[id], ...config } };
      localStorage.setItem('connections', JSON.stringify(next));
      return next;
    });
  }, []);

  const isConnected = useCallback((id) => {
    return !!connections[id]?.connected;
  }, [connections]);

  return (
    <AppContext.Provider value={{
      connections,
      updateConnection,
      isConnected,
      theme,
      toggleTheme,
      llmLabel,
      addToast
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
