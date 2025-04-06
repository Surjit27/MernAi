import { ModelType } from '../types/chat';

export interface ModelInfo {
  id: string;
  name: string;
  format: 'pkl' | 'onnx' | 'h5' | 'pt';
  size: number;
  timestamp: string;
  type: ModelType;
}

export class ModelValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ModelValidationError';
  }
}

export const validateModelFile = (file: File): Promise<ModelInfo> => {
  return new Promise((resolve, reject) => {
    // Check file extension
    if (!file.name.toLowerCase().endsWith('.pkl')) {
      reject(new ModelValidationError('Invalid file format. Only .pkl files are supported.'));
      return;
    }

    // Check file size (e.g., max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB in bytes
    if (file.size > maxSize) {
      reject(new ModelValidationError('File size too large. Maximum size is 500MB.'));
      return;
    }

    const modelInfo: ModelInfo = {
      id: Date.now().toString(),
      name: file.name,
      format: 'pkl',
      size: file.size,
      timestamp: new Date().toISOString(),
      type: 'gpt-4', // Default type, should be determined by model metadata
    };

    resolve(modelInfo);
  });
}; 