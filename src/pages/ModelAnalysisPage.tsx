import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { ArrowLeft, Download, BarChart2, LineChart as LineChartIcon, Activity } from 'lucide-react';
import { BenchmarkResult } from '../types';

const ModelAnalysisPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [models, setModels] = useState<BenchmarkResult[]>([]);
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'accuracy' | 'performance' | 'detailed'>('accuracy');

    useEffect(() => {
        if (location.state?.models) {
            setModels(location.state.models);
            const data = generateAnalysisData(location.state.models);
            setAnalysisData(data);
        }
    }, [location.state]);

    const generateAnalysisData = (models: BenchmarkResult[]) => {
        return {
            accuracy: models.map(model => ({
                name: model.modelName,
                accuracy: model.metrics.accuracy * 100,
                f1Score: model.metrics.f1Score * 100,
                precision: model.metrics.precision * 100,
                recall: model.metrics.recall * 100
            })),
            performance: models.map(model => ({
                name: model.modelName,
                latency: model.metrics.latency,
                throughput: model.metrics.throughput,
                memoryUsage: model.metrics.memoryUsage,
                modelSize: model.metrics.modelSize
            })),
            detailed: models.map(model => ({
                name: model.modelName,
                accuracy: model.metrics.accuracy * 100,
                f1Score: model.metrics.f1Score * 100,
                precision: model.metrics.precision * 100,
                recall: model.metrics.recall * 100,
                latency: model.metrics.latency,
                throughput: model.metrics.throughput,
                memoryUsage: model.metrics.memoryUsage,
                modelSize: model.metrics.modelSize
            }))
        };
    };

    const handleDownloadResults = () => {
        const csvContent = [
            ['Model', 'Accuracy', 'F1 Score', 'Precision', 'Recall', 'Latency', 'Throughput', 'Memory Usage', 'Model Size'],
            ...models.map(model => [
                model.modelName,
                (model.metrics.accuracy * 100).toFixed(2) + '%',
                (model.metrics.f1Score * 100).toFixed(2) + '%',
                (model.metrics.precision * 100).toFixed(2) + '%',
                (model.metrics.recall * 100).toFixed(2) + '%',
                model.metrics.latency + 'ms',
                model.metrics.throughput + ' req/s',
                model.metrics.memoryUsage + 'MB',
                model.metrics.modelSize + 'MB'
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'model_comparison_results.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="p-4 space-y-6">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back to Model Selection</span>
                        </button>
                        <button
                            onClick={handleDownloadResults}
                            className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                            <Download className="w-5 h-5" />
                            <span>Download Results</span>
                        </button>
                    </div>

                    <h1 className="text-2xl font-bold">Model Comparison Analysis</h1>

                    {/* Tab Navigation */}
                    <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('accuracy')}
                            className={`flex items-center space-x-2 px-4 py-2 ${
                                activeTab === 'accuracy'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <BarChart2 className="w-5 h-5" />
                            <span>Accuracy Metrics</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('performance')}
                            className={`flex items-center space-x-2 px-4 py-2 ${
                                activeTab === 'performance'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Activity className="w-5 h-5" />
                            <span>Performance Metrics</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('detailed')}
                            className={`flex items-center space-x-2 px-4 py-2 ${
                                activeTab === 'detailed'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <LineChartIcon className="w-5 h-5" />
                            <span>Detailed Analysis</span>
                        </button>
                    </div>

                    {/* Accuracy Metrics Tab */}
                    {activeTab === 'accuracy' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                                <h2 className="text-lg font-semibold mb-4">Accuracy Comparison</h2>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analysisData?.accuracy}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="accuracy" fill="#8884d8" name="Accuracy" />
                                            <Bar dataKey="f1Score" fill="#82ca9d" name="F1 Score" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                                <h2 className="text-lg font-semibold mb-4">Precision & Recall</h2>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={analysisData?.accuracy}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }} />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="precision" stroke="#ff7300" name="Precision" />
                                            <Line type="monotone" dataKey="recall" stroke="#387908" name="Recall" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Performance Metrics Tab */}
                    {activeTab === 'performance' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                                <h2 className="text-lg font-semibold mb-4">Latency & Throughput</h2>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analysisData?.performance}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis yAxisId="left" orientation="left" label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }} />
                                            <YAxis yAxisId="right" orientation="right" label={{ value: 'Throughput (req/s)', angle: 90, position: 'insideRight' }} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar yAxisId="left" dataKey="latency" fill="#8884d8" name="Latency" />
                                            <Bar yAxisId="right" dataKey="throughput" fill="#82ca9d" name="Throughput" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                                <h2 className="text-lg font-semibold mb-4">Resource Usage</h2>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={analysisData?.performance}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="name" />
                                            <PolarRadiusAxis />
                                            <Radar name="Memory Usage" dataKey="memoryUsage" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                            <Radar name="Model Size" dataKey="modelSize" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                                            <Legend />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Detailed Analysis Tab */}
                    {activeTab === 'detailed' && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                                <h2 className="text-lg font-semibold mb-4">Detailed Metrics</h2>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead>
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Model</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Accuracy</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">F1 Score</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Precision</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recall</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Latency</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Throughput</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Memory Usage</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Model Size</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {models.map((model) => (
                                                <tr key={model.modelName}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                        {model.modelName}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {(model.metrics.accuracy * 100).toFixed(2)}%
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {(model.metrics.f1Score * 100).toFixed(2)}%
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {(model.metrics.precision * 100).toFixed(2)}%
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {(model.metrics.recall * 100).toFixed(2)}%
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {model.metrics.latency}ms
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {model.metrics.throughput} req/s
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {model.metrics.memoryUsage}MB
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {model.metrics.modelSize}MB
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModelAnalysisPage; 