import React, { useState } from 'react';
import { Search, Filter, ArrowUpDown, Tag, Info, Plus, Check, ArrowLeft, X } from 'lucide-react';
import { BenchmarkResult } from '../types';
import { useNavigate } from 'react-router-dom';
import { useDataset } from '../context/DatasetContext';
import { useModel } from '../context/ModelContext';

const ModelLibraryPage: React.FC = () => {
    const navigate = useNavigate();
    const { dataset } = useDataset();
    const { selectedModels, addModel, removeModel, clearModels } = useModel();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<keyof ModelMetrics>('accuracy');
    const [selectedModel, setSelectedModel] = useState<BenchmarkResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Mock data for demonstration
    const models: BenchmarkResult[] = [
        {
            modelName: "ResNet50",
            metrics: {
                accuracy: 0.95,
                latency: 50,
                throughput: 100
            },
            timestamp: new Date().toISOString()
        },
        {
            modelName: "EfficientNet",
            metrics: {
                accuracy: 0.92,
                latency: 30,
                throughput: 150
            },
            timestamp: new Date().toISOString()
        }
    ];

    const allTags = Array.from(new Set(models.flatMap(model => model.tags || [])));

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const filteredModels = models
        .filter(model =>
            model.modelName.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (selectedTags.length === 0 || selectedTags.every(tag => model.tags?.includes(tag)))
        )
        .sort((a, b) => b.metrics[sortBy] - a.metrics[sortBy]);

    const handleModelSelect = (model: BenchmarkResult) => {
        if (selectedModels.some(m => m.modelName === model.modelName)) {
            removeModel(model.modelName);
        } else {
            addModel(model);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="p-4 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span>Back to Model Selection</span>
                            </button>
                            <h1 className="text-2xl font-bold">Model Library</h1>
                        </div>
                        {selectedModels.length > 0 && (
                            <div className="flex space-x-4">
                                <button
                                    onClick={clearModels}
                                    className="flex items-center space-x-2 text-red-600 hover:text-red-800"
                                >
                                    <X className="w-5 h-5" />
                                    <span>Clear Selected Models</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 space-y-6">
                            {/* Search and Filters */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                                <div className="relative mb-6">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search models..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                        Sort by
                                    </h3>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as keyof ModelMetrics)}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="accuracy">Accuracy</option>
                                        <option value="inferenceTime">Inference Time</option>
                                        <option value="memoryUsage">Memory Usage</option>
                                        <option value="modelSize">Model Size</option>
                                    </select>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                        Filter by tags
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {allTags.map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => toggleTag(tag)}
                                                className={`px-3 py-1 rounded-full text-sm ${
                                                    selectedTags.includes(tag)
                                                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                                }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="space-y-6">
                                {/* Selected Models Preview */}
                                {selectedModels.length > 0 && (
                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                                        <h3 className="text-lg font-semibold mb-4">Selected Models ({selectedModels.length})</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedModels.map(model => (
                                                <div key={model.modelName} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                    <span className="font-medium">{model.modelName}</span>
                                                    <button
                                                        onClick={() => removeModel(model.modelName)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Model List */}
                                {filteredModels.map(model => (
                                    <div
                                        key={model.modelName}
                                        className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg cursor-pointer transition-colors ${
                                            selectedModel?.modelName === model.modelName
                                                ? 'ring-2 ring-indigo-500'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-750'
                                        }`}
                                        onClick={() => setSelectedModel(model)}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                    {model.modelName}
                                                </h2>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Version {model.version} • {model.framework} • {new Date(model.timestamp).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleModelSelect(model);
                                                }}
                                                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                                                    selectedModels.some(m => m.modelName === model.modelName)
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                }`}
                                            >
                                                {selectedModels.some(m => m.modelName === model.modelName)
                                                    ? <Check className="w-4 h-4 mr-2" />
                                                    : <Plus className="w-4 h-4 mr-2" />}
                                                {selectedModels.some(m => m.modelName === model.modelName)
                                                    ? 'Selected'
                                                    : 'Select for Comparison'}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Accuracy</p>
                                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {(model.metrics.accuracy * 100).toFixed(2)}%
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Inference Time</p>
                                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {model.metrics.inferenceTime}ms
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Memory Usage</p>
                                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {model.metrics.memoryUsage}MB
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Model Size</p>
                                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {model.metrics.modelSize}MB
                                                </p>
                                            </div>
                                        </div>

                                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                                            {model.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
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

export default ModelLibraryPage;