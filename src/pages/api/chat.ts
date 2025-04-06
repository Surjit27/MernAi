import { NextApiRequest, NextApiResponse } from 'next';
import { ModelType, ApiResponse } from '../../types/chat';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, model } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    if (!model || !['gpt-4', 'gpt-3.5-turbo', 'claude-2', 'llama-2'].includes(model)) {
      return res.status(400).json({ error: 'Invalid model specified' });
    }

    // Here you would typically:
    // 1. Validate API key/auth
    // 2. Call the appropriate LLM API
    // 3. Process the response
    // For now, we'll simulate a response

    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response: ApiResponse = {
      id: Date.now().toString(),
      content: `This is a simulated response from ${model} to your message: "${message}"`,
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Chat API Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'An error occurred while processing your request',
    });
  }
} 