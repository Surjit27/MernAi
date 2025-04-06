const API_BASE_URL = 'http://localhost:3000/api';

export interface BenchmarkResult {
    // Define your benchmark result interface here
    id?: string;
    modelName: string;
    metrics: {
        accuracy: number;
        latency: number;
        throughput: number;
    };
    timestamp?: string;
}

export interface EvaluationMetrics {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
}

export interface EvaluationResponse {
    status: string;
    metrics?: EvaluationMetrics;
    predictions?: number[];
    message?: string;
}

export const api = {
    // Benchmark endpoints
    getBenchmarks: async (): Promise<BenchmarkResult[]> => {
        const response = await fetch(`${API_BASE_URL}/benchmark`);
        return response.json();
    },

    saveBenchmark: async (benchmark: BenchmarkResult): Promise<BenchmarkResult> => {
        const response = await fetch(`${API_BASE_URL}/benchmark`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(benchmark),
        });
        return response.json();
    },

    // Model endpoints
    getModels: async (): Promise<BenchmarkResult[]> => {
        const response = await fetch(`${API_BASE_URL}/models`);
        return response.json();
    },

    saveModel: async (model: BenchmarkResult): Promise<BenchmarkResult> => {
        const response = await fetch(`${API_BASE_URL}/models`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(model),
        });
        return response.json();
    },

    // Model evaluation endpoints
    uploadModel: async (formData: FormData): Promise<{ message: string; filepath: string; error?: string }> => {
        try {
            // Log the FormData contents for debugging
            console.log('FormData contents:', Array.from(formData.entries()));

            const response = await fetch(`${API_BASE_URL}/upload/model`, {
                method: 'POST',
                body: formData,
            });

            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                throw new Error('Server response was not JSON');
            }

            if (!response.ok) {
                const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`;
                console.error('Upload failed:', errorMessage);
                throw new Error(errorMessage);
            }

            if (!data.filepath) {
                throw new Error('Server response missing filepath');
            }

            return {
                message: data.message || 'Upload successful',
                filepath: data.filepath,
            };
        } catch (error) {
            console.error('Upload error details:', error);
            if (error instanceof Error) {
                return { message: 'Upload failed', filepath: '', error: error.message };
            }
            return { message: 'Upload failed', filepath: '', error: 'Unknown error occurred' };
        }
    },

    uploadDataset: async (file: File): Promise<{ message: string; filepath: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${API_BASE_URL}/upload/dataset`, {
            method: 'POST',
            body: formData,
        });
        return response.json();
    },

    evaluateModel: async (modelPath: string, datasetPath: string): Promise<EvaluationResponse> => {
        const response = await fetch(`${API_BASE_URL}/evaluate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model_path: modelPath,
                dataset_path: datasetPath,
            }),
        });
        return response.json();
    },

    // Analysis endpoint
    performAnalysis: async (data: any): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/analysis`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return response.json();
    },
}; 