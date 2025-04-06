import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModel } from '../context/ModelContext';
import { BenchmarkResult } from '../types';
import { Info, X, Upload } from 'lucide-react';
import { api } from '../services/api';

const ModelSelectionPage: React.FC = () => {
    const navigate = useNavigate();
    const { selectedModels, addModel, clearModels } = useModel();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleEvaluate = () => {
        if (selectedModels.length < 2) {
            setError('Please select at least two models to compare');
            return;
        }
        navigate('/results', { 
            state: { 
                models: selectedModels,
                type: 'comparison',
                showAnalysis: true
            } 
        });
    };

    const handleModelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('model', file);

            // Upload the model
            const response = await api.uploadModel(formData);
            
            // Create a new model entry
            const newModel: BenchmarkResult = {
                modelName: file.name,
                modelId: response.filepath,
                metrics: {
                    accuracy: 0,
                    precision: 0,
                    recall: 0,
                    f1Score: 0,
                    latency: 0,
                    throughput: 0,
                    memoryUsage: 0,
                    modelSize: 0
                },
                timestamp: new Date().toISOString()
            };

            // Add the model to the context
            addModel(newModel);
            setError(null);
        } catch (err) {
            setError('Failed to upload model. Please try again.');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="p-4 space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Model Selection</h1>
                        {selectedModels.length > 0 && (
                            <div className="flex space-x-4">
                                <button
                                    onClick={clearModels}
                                    className="flex items-center space-x-2 text-red-600 hover:text-red-800"
                                >
                                    <X className="w-5 h-5" />
                                    <span>Clear Selected Models</span>
                                </button>
                                <button
                                    onClick={handleEvaluate}
                                    className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                >
                                    <Info className="w-5 h-5" />
                                    <span>Evaluate Models</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Upload Custom Model Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Upload Custom Model</h2>
                        <div className="flex flex-col items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400" />
                                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Supported formats: .h5, .pkl, .pt, .pth
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".h5,.pkl,.pt,.pth"
                                    onChange={handleModelUpload}
                                    disabled={loading}
                                />
                            </label>
                            {loading && (
                                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                    Uploading model...
                                </div>
                            )}
                            {error && (
                                <div className="mt-4 text-sm text-red-500">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selected Models Section */}
                    <div className="space-y-4">
                        {selectedModels.map((model) => (
                            <div key={model.modelName} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                            {model.modelName}
                                        </h2>
                                        <div className="mt-4 space-y-2">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Accuracy: {(model.metrics.accuracy * 100).toFixed(2)}%
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Latency: {model.metrics.latency}ms
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Throughput: {model.metrics.throughput} req/s
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeModel(model.modelName)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="p-2 bg-red-100 text-red-700 rounded">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModelSelectionPage; 