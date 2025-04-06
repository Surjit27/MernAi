export type ModelType = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-2' | 'llama-2';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  modelType?: ModelType;
  error?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  selectedModel: ModelType;
}

export interface ApiResponse {
  id: string;
  content: string;
  timestamp: string;
  error?: string;
} 