import { useState, useEffect, useCallback } from 'react';

export const useConnections = () => {
  const [connections, setConnections] = useState({});

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('connections') || '{}');
    setConnections(saved);

    const handleUpdate = () => {
      const updated = JSON.parse(localStorage.getItem('connections') || '{}');
      setConnections(updated);
    };

    window.addEventListener('settingsUpdated', handleUpdate);
    return () => window.removeEventListener('settingsUpdated', handleUpdate);
  }, []);

  const updateConnection = useCallback((id, config) => {
    setConnections(prev => {
      const next = { ...prev, [id]: { ...prev[id], ...config } };
      localStorage.setItem('connections', JSON.stringify(next));
      window.dispatchEvent(new Event('settingsUpdated'));
      return next;
    });
  }, []);

  const isConnected = useCallback((id) => {
    return !!connections[id]?.connected;
  }, [connections]);

  const getLLMConfig = useCallback(() => {
    return connections.llm || { provider: 'openai' };
  }, [connections]);

  return { connections, updateConnection, isConnected, getLLMConfig };
};
