import OpenAI from 'openai';

export const openrouter = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
        "HTTP-Referer": "https://kit-agent.vercel.app",
        "X-Title": "Kit Agent",
    },
});
