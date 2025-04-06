import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { ModelType, Message, ChatState } from '../types/chat';
import { ModelInfo } from '../utils/modelHandler';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Typography, CircularProgress, Paper, Card, CardContent, Grid } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const AVAILABLE_MODELS: ModelType[] = ['gpt-4', 'gpt-3.5-turbo', 'claude-2', 'llama-2'];

interface DatasetInfo {
  columns: string[];
  shape: [number, number];
  numeric_columns: string[];
  dtypes: { [key: string]: string };
  filepath: string;
  filename: string;
}

interface UploadedModelInfo {
  filepath: string;
  filename: string;
}

interface EvaluationResult {
  status: string;
  metrics?: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
  };
  message?: string;
}

const LLMInteractionPage: React.FC = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    selectedModel: 'gpt-4',
  });
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [customModel, setCustomModel] = useState<ModelInfo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);
  const [modelInfo, setModelInfo] = useState<UploadedModelInfo | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(prev => ({
      ...prev,
      selectedModel: e.target.value as ModelType,
    }));
  };

  const formatTimestamp = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const handleModelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setState(prev => ({
        ...prev,
        error: 'No file selected',
      }));
      return;
    }

    // Validate file type client-side first
    if (!file.name.toLowerCase().endsWith('.pkl')) {
      setState(prev => ({
        ...prev,
        error: 'Invalid file format. Only .pkl files are supported.',
      }));
      return;
    }

    const formData = new FormData();
    formData.append('model', file);

    try {
      setState(prev => ({ 
        ...prev, 
        isLoading: true, 
        error: null 
      }));

      console.log('Uploading file:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      const response = await fetch('/api/model/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload model');
      }

      console.log('Upload successful:', data);

      setCustomModel(data.modelInfo);
      setState(prev => ({
        ...prev,
        selectedModel: data.modelInfo.type,
        isLoading: false,
      }));

      // Clear the file input for next upload
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to upload model',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || state.isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: formatTimestamp(new Date()),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));
    setInput('');

    try {
      let response;
      
      if (customModel) {
        // Use custom model inference
        response = await fetch('/api/model/inference', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            modelId: customModel.id,
            input: input.trim(),
          }),
        });
      } else {
        // Use regular chat API
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: input.trim(),
            model: state.selectedModel,
          }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: data.id || Date.now().toString(),
        content: customModel ? data.result : data.content,
        role: 'assistant',
        timestamp: formatTimestamp(new Date()),
        modelType: customModel ? (customModel.name as ModelType) : state.selectedModel,
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleDatasetUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError('Please select a dataset file');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log(`Uploading dataset: ${file.name}`);
      const response = await fetch('/api/upload/dataset', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload dataset');
      }

      console.log('Dataset upload success:', data);
      setDatasetInfo({
        columns: data.columns,
        shape: data.shape,
        numeric_columns: data.numeric_columns,
        dtypes: data.dtypes,
        filepath: data.filepath,
        filename: data.filename
      });
      
      // Reset target selection when new dataset is uploaded
      setSelectedTarget('');
      setEvaluationResult(null);
    } catch (err: any) {
      console.error('Dataset upload error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError('Please select a model file');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log(`Uploading model: ${file.name}`);
      const response = await fetch('/api/upload/model', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload model');
      }

      console.log('Model upload success:', data);
      setModelInfo({
        filepath: data.filepath,
        filename: file.name
      });
      setEvaluationResult(null);
    } catch (err: any) {
      console.error('Model upload error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!modelInfo?.filepath || !datasetInfo) {
      setError('Please upload both a model and dataset first');
      return;
    }

    if (!selectedTarget) {
      setError('Please select a target column');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`Evaluating model with target column: ${selectedTarget}`);
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_path: modelInfo.filepath,
          dataset_path: datasetInfo.filepath,
          target_column: selectedTarget
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Evaluation failed');
      }

      console.log('Evaluation result:', data);
      setEvaluationResult(data);
    } catch (err: any) {
      console.error('Evaluation error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                LLM Chat Interface
              </h1>
              <div className="flex items-center space-x-4">
                {!customModel ? (
                  <select
                    value={state.selectedModel}
                    onChange={handleModelChange}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm"
                  >
                    {AVAILABLE_MODELS.map(model => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Using: {customModel.name}
                    </span>
                    <button
                      onClick={() => setCustomModel(null)}
                      className="text-sm text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                >
                  Upload Model
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pkl"
                  onChange={handleModelFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Chat Window */}
          <div className="h-[600px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {state.messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                    <div className="mt-1 text-xs opacity-70">
                      {message.timestamp}
                      {message.modelType && ` • ${message.modelType}`}
                    </div>
                  </div>
                </div>
              ))}
              {state.isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                  </div>
                </div>
              )}
              {state.error && (
                <div className="flex justify-center">
                  <div className="flex items-center space-x-2 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{state.error}</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSubmit} className="flex space-x-4">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-1 min-h-[2.5rem] max-h-32 p-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg resize-none"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || state.isLoading}
                  className={`px-4 py-2 rounded-lg ${
                    !input.trim() || state.isLoading
                      ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } text-white`}
                >
                  {state.isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LLMInteractionPage; 