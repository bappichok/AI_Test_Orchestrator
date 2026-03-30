import { useApp } from '../context/AppContext.jsx';

/**
 * DEPRECATED: Use `useApp()` from AppContext instead.
 * This hook is kept for backward compatibility but will be removed in v2.0.
 * 
 * Migration:
 *   Old: const { connections, updateConnection, isConnected } = useConnections();
 *   New: const { connections, updateConnection, isConnected } = useApp();
 */
export const useConnections = () => {
  const { connections, updateConnection, isConnected } = useApp();

  const getLLMConfig = () => {
    return connections.llm || { provider: 'openai' };
  };

  return { connections, updateConnection, isConnected, getLLMConfig };
};
