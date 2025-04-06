export interface HardwareMetrics {
  cpu: {
    inferenceTime: number;
    latency: number;
    throughput: number;
  };
  gpu?: {
    inferenceTime: number;
    latency: number;
    throughput: number;
  };
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  inferenceTime: number;
  memoryUsage: number;
  parameters: number;
  flops: number;
  modelSize: number;
  trainingTime?: number;
  hardware: HardwareMetrics;
  folds?: {
    accuracy: number[];
    precision: number[];
    recall: number[];
    f1Score: number[];
    inferenceTime: number[];
  };
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  size: number;
  format: string;
  createdAt: Date;
  source: 'local' | 'kaggle' | 'huggingface';
  sourceUrl?: string;
  metadata?: Record<string, any>;
}

export interface BenchmarkResult {
  modelName: string;
  metrics: ModelMetrics;
  framework: string;
  timestamp: Date;
  description?: string;
  tags?: string[];
  version?: string;
  trainingDataset?: string;
  architecture?: string;
  datasetId?: string;
  tested?: boolean;
  fromLibrary?: boolean;
}

export interface ModelVersion {
  version: string;
  timestamp: Date;
  metrics: ModelMetrics;
  changes?: string;
}

export interface ExternalDataset {
  id: string;
  name: string;
  description: string;
  size?: number;
  source: 'kaggle' | 'huggingface';
  url: string;
  tags?: string[];
  downloads?: number;
  lastUpdated?: Date;
}