import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { resolveLlmCredentials } from '../utils/credentialHandler.js';

/**
 * AI Orchestration Layer
 * Handles communication with various LLM providers.
 */

export const routeToLLM = async (systemPrompt, userPrompt, settings) => {
  const { provider, apiKey, baseUrl, model } = resolveLlmCredentials(settings);

  switch (provider) {
    case 'openai':
      return await callOpenAI(systemPrompt, userPrompt, apiKey, model);
    case 'anthropic':
      return await callAnthropic(systemPrompt, userPrompt, apiKey, model);
    case 'ollama':
      return await callOllama(systemPrompt, userPrompt, baseUrl, model);
    case 'groq':
      return await callGroq(systemPrompt, userPrompt, apiKey, model);
    case 'gemini':
      return await callGemini(systemPrompt, userPrompt, apiKey, model);
    case 'custom':
      return await callCustom(systemPrompt, userPrompt, apiKey, baseUrl, model);
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
};

async function callOpenAI(systemPrompt, userPrompt, apiKey, model = 'gpt-4o') {
  if (!apiKey) throw new Error('OpenAI API Key is missing');
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      temperature: 0.3,
      max_tokens: 3000
    },
    { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
  );
  return response.data.choices[0].message.content;
}

async function callAnthropic(systemPrompt, userPrompt, apiKey, model = 'claude-3-5-sonnet-20241022') {
  if (!apiKey) throw new Error('Anthropic API Key is missing');
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model,
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    },
    { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' } }
  );
  return response.data.content[0].text;
}

async function callOllama(systemPrompt, userPrompt, baseUrl, model = 'llama3') {
  const url = `${baseUrl || 'http://localhost:11434'}/api/chat`;
  const response = await axios.post(url, {
    model,
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
    stream: false,
    options: { temperature: 0.3 }
  });
  return response.data.message.content;
}

async function callGroq(systemPrompt, userPrompt, apiKey, model = 'llama-3.3-70b-versatile') {
  if (!apiKey) throw new Error('Groq API Key is missing');
  // Failsafe: if the UI sent corrupted data like 'mistral' or 'mestrail', force a valid one
  const validModels = ['llama-3.3-70b-versatile', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it'];
  if (!model || !validModels.includes(model)) {
    model = 'llama-3.3-70b-versatile';
  }
  console.log(`\n[Groq API] Invoking endpoint with exact model string: "${model}"\n`);

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      temperature: 0.3,
      max_tokens: 3000
    },
    { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
  );
  return response.data.choices[0].message.content;
}

async function callGemini(systemPrompt, userPrompt, apiKey, model = 'gemini-1.5-flash') {
  if (!apiKey) throw new Error('Gemini API Key is missing');
  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({ model });
  const result = await genModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    systemInstruction: systemPrompt,
    generationConfig: { temperature: 0.3 }
  });
  return result.response.text();
}

async function callCustom(systemPrompt, userPrompt, apiKey, baseUrl, model) {
  const response = await axios.post(
    `${baseUrl}/chat/completions`,
    {
      model,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      temperature: 0.3,
      max_tokens: 3000
    },
    { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey || 'sk-no-key'}` } }
  );
  return response.data.choices[0].message.content;
}
