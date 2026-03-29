const axios = require('axios');

async function run() {
  try {
    const res = await axios.post('http://localhost:3001/api/generate/test-cases', {
      story: {
        id: "MANUAL-1",
        title: "Test",
        description: "Google.com search",
        acceptance_criteria: [],
        priority: "High",
        type: "Story"
      },
      settings: {
        llmProvider: "groq",
        groqModel: "llama-3.3-70b-versatile",
        apiKey: process.env.GROQ_API_KEY // Ensure the backend handles empty key gracefully
      }
    });
    console.log("SUCCESS:", res.data);
  } catch (e) {
    if (e.response) {
      console.log("SERVER ERROR:", e.response.status, e.response.data);
    } else {
      console.log("REQUEST ERROR:", e.message);
    }
  }
}

run();
