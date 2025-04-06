import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { Upload, FileDown, Loader2, BarChart3, GitCompare, Database, ExternalLink, Trash2, X, Library, PlayCircle, Info } from 'lucide-react';
import { BenchmarkResult, Dataset, ModelMetrics } from '../types';
import ComparisonChart from '../components/ComparisonChart';
import RadarChart from '../components/RadarChart';
import HardwareComparison from '../components/HardwareComparison';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import DatasetUploader from '../components/DatasetUploader';
import { useNavigate } from 'react-router-dom';
import { useDataset } from '../context/DatasetContext';
import { useModel } from '../context/ModelContext';
import { api } from '../services/api';

interface UnifiedBenchmarkPageProps {
  savedState: {
    selectedModels: BenchmarkResult[];
    comparisonResults: BenchmarkResult[];
  };
  onStateChange: (state: {
    selectedModels: BenchmarkResult[];
    comparisonResults: BenchmarkResult[];
  }) => void;
}

const UnifiedBenchmarkPage: React.FC<UnifiedBenchmarkPageProps> = ({ savedState, onStateChange }) => {
  const navigate = useNavigate();
  const { dataset, datasetPath, setDataset, setDatasetPath } = useDataset();
  const { selectedModels, addModel, removeModel, clearModels } = useModel();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [comparisonResults, setComparisonResults] = useState<BenchmarkResult[]>([]);
  const [selectedModel, setSelectedModel] = useState<BenchmarkResult | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    // Load initial data if available
    if (savedState.selectedModels.length > 0) {
      savedState.selectedModels.forEach(model => addModel(model));
    }
    if (savedState.comparisonResults.length > 0) {
      setComparisonResults(savedState.comparisonResults);
    }
  }, []);

  const handleDatasetUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setDataset(file);
      const formData = new FormData();
      formData.append('file', file);

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('http://localhost:3000/api/upload/dataset', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || `Upload failed with status: ${response.status}`);
        }

        if (data.error) {
          throw new Error(data.error);
        }

        setDatasetPath(data.filepath);
        setSuccessMessage('Dataset uploaded successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        console.error('Dataset upload error:', err);
        setError(err instanceof Error ? err.message : 'Failed to upload dataset');
        setSuccessMessage(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleModelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validExtensions = ['.h5', '.pt', '.pth', '.onnx', '.pkl'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      setError(`Invalid file format. Supported formats: ${validExtensions.join(', ')}`);
      return;
    }

    // Validate file size (max 1GB)
    const maxSize = 1024 * 1024 * 1024; // 1GB in bytes
    if (file.size > maxSize) {
      setError('File size exceeds limit (max 1GB)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Add content type to the model file
      const contentType = {
        '.h5': 'application/x-hdf',
        '.pt': 'application/octet-stream',
        '.pth': 'application/octet-stream',
        '.onnx': 'application/octet-stream',
        '.pkl': 'application/octet-stream'
      }[fileExtension];
      
      if (contentType) {
        formData.append('content_type', contentType);
      }

      console.log('Uploading model:', {
        name: file.name,
        size: file.size,
        type: contentType
      });

      // Upload the model
      const response = await api.uploadModel(formData);
      
      if (!response) {
        throw new Error('No response received from server');
      }

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.filepath) {
        throw new Error('Server response missing filepath');
      }

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
          modelSize: file.size
        },
        timestamp: new Date().toISOString(),
        fromLibrary: false
      };

      // Add the model to the context
      addModel(newModel);
      
      // Show success message
      setError(null);
      setSuccessMessage(`Successfully uploaded ${file.name}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Clear the file input
      if (event.target) {
        event.target.value = '';
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload model');
      setSuccessMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (selectedModels.length === 0) {
        setError('Please select at least one model to evaluate.');
        return;
    }

    try {
        setLoading(true);
        const results: BenchmarkResult[] = [];

        // Evaluate each model
        for (const model of selectedModels) {
            try {
                let modelMetrics: ModelMetrics;

                // Check if this is a library model or custom uploaded model
                if (model.fromLibrary) {
                    // For library models, use simulated metrics
                    modelMetrics = {
                        accuracy: Math.random() * 0.3 + 0.7,
                        f1Score: Math.random() * 0.3 + 0.7,
                        precision: Math.random() * 0.3 + 0.7,
                        recall: Math.random() * 0.3 + 0.7,
                        latency: Math.random() * 100 + 50,
                        throughput: Math.random() * 1000 + 500,
                        memoryUsage: Math.random() * 1000 + 500,
                        modelSize: Math.random() * 100 + 50
                    };
                } else {
                    // For custom models, perform actual evaluation with dataset
                    if (!dataset || !datasetPath) {
                        throw new Error('Please upload a dataset before evaluating custom models');
                    }

                    try {
                        const result = await api.evaluateModel(model.modelId, datasetPath);
                        if (!result.metrics) {
                            throw new Error('Evaluation failed to return metrics');
                        }
                        modelMetrics = result.metrics;
                    } catch (evalError) {
                        console.error(`Evaluation error for ${model.modelName}:`, evalError);
                        throw new Error(`Failed to evaluate ${model.modelName}: ${evalError.message}`);
                    }
                }

                const benchmarkResult: BenchmarkResult = {
                    modelName: model.modelName,
                    modelId: model.modelId,
                    metrics: modelMetrics,
                    timestamp: new Date().toISOString(),
                    fromLibrary: model.fromLibrary
                };
                results.push(benchmarkResult);
            } catch (modelError) {
                console.error(`Error evaluating model ${model.modelName}:`, modelError);
                results.push({
                    modelName: model.modelName,
                    modelId: model.modelId,
                    metrics: {
                        accuracy: 0,
                        f1Score: 0,
                        precision: 0,
                        recall: 0,
                        latency: 0,
                        throughput: 0,
                        memoryUsage: 0,
                        modelSize: 0
                    },
                    timestamp: new Date().toISOString(),
                    fromLibrary: model.fromLibrary,
                    error: `Failed to evaluate model: ${modelError.message}`
                });
            }
        }

        // Update state with results
        setComparisonResults(results);
        onStateChange({
            selectedModels,
            comparisonResults: results
        });
        setError(null);

        // Navigate to Results & Analysis tab
        setActiveTab(2);

        // Scroll to the results section
        const resultsSection = document.querySelector('#results-section');
        if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (err) {
        console.error('Evaluation error:', err);
        setError('Failed to evaluate models. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  const generateReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Benchmark Report', 20, 20);

    if (dataset) {
      doc.setFontSize(16);
      doc.text('Dataset Information', 20, 40);
      doc.setFontSize(12);
      doc.text(`Name: ${dataset.name}`, 20, 50);
      doc.text(`Size: ${(dataset.size / 1024 / 1024).toFixed(2)} MB`, 20, 60);
    }

    if (comparisonResults.length > 0) {
      doc.setFontSize(16);
      doc.text('Model Analysis', 20, 80);

      const modelData = comparisonResults.map(model => [
        model.modelName,
        (model.metrics.accuracy * 100).toFixed(2) + '%',
        (model.metrics.latency * 100).toFixed(2) + '%',
        (model.metrics.throughput * 100).toFixed(2) + '%',
      ]);

      (doc as any).autoTable({
        startY: 90,
        head: [['Model', 'Accuracy', 'Latency', 'Throughput']],
        body: modelData,
      });

      // Add cross-validation results
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Cross-Validation Analysis', 20, 20);

      comparisonResults.forEach((model, index) => {
        const startY = 40 + (index * 60);
        doc.setFontSize(14);
        doc.text(`${model.modelName} - Performance`, 20, startY);
        
        const performanceData = [
          'Accuracy',
          (model.metrics.accuracy * 100).toFixed(2) + '%',
          'Latency',
          model.metrics.latency.toFixed(2) + 'ms',
          'Throughput',
          model.metrics.throughput.toFixed(2) + ' req/s',
        ];

        (doc as any).autoTable({
          startY: startY + 10,
          head: [performanceData],
          margin: { left: 20 },
        });
      });
    }

    doc.save('benchmark-report.pdf');
  };

  const navigateToLibrary = () => {
    navigate('/model-library');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Benchmark & Compare
          </h1>
          {comparisonResults.length > 0 && (
            <button
              onClick={generateReport}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileDown className="w-5 h-5 mr-2" />
              Generate Report
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
            <Tab.List className="flex space-x-1 bg-indigo-100 dark:bg-indigo-900/20 p-1">
              <Tab className={({ selected }) =>
                `w-full py-2.5 text-sm font-medium leading-5 rounded-lg
                ${selected
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-indigo-700 hover:bg-indigo-200 dark:text-indigo-300'
                }`
              }>
                Dataset Selection
              </Tab>
              <Tab className={({ selected }) =>
                `w-full py-2.5 text-sm font-medium leading-5 rounded-lg
                ${selected
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-indigo-700 hover:bg-indigo-200 dark:text-indigo-300'
                }`
              }>
                Model Selection
              </Tab>
              <Tab className={({ selected }) =>
                `w-full py-2.5 text-sm font-medium leading-5 rounded-lg
                ${selected
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-indigo-700 hover:bg-indigo-200 dark:text-indigo-300'
                }`
              }>
                Results & Analysis
              </Tab>
            </Tab.List>

            <Tab.Panels className="p-6">
              {/* Dataset Selection Panel */}
              <Tab.Panel>
                <div className="space-y-6">
                  <DatasetUploader onDatasetSelect={setDataset} />

                  {successMessage && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start animate-fade-in">
                      <div className="text-green-600 dark:text-green-400">✅</div>
                      <p className="ml-3 text-green-600 dark:text-green-400">{successMessage}</p>
                    </div>
                  )}

                  {dataset && (
                    <div className="mt-8">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Available Datasets
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div
                          className={`relative p-4 rounded-lg border-2 transition-colors ${
                            selectedModel?.id === dataset.id
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                          }`}
                        >
                          <button
                            onClick={() => setDataset(null)}
                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div 
                            className="cursor-pointer"
                            onClick={() => setSelectedModel(dataset)}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                  {dataset.name}
                                </h3>
                                {dataset.description && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {dataset.description}
                                  </p>
                                )}
                              </div>
                              {dataset.source !== 'local' && dataset.sourceUrl && (
                                <a
                                  href={dataset.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-700"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                            <div className="mt-2">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Size: {(dataset.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Source: {dataset.source}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Tab.Panel>

              {/* Model Selection Panel */}
              <Tab.Panel>
                <div className="space-y-6">
                  {!dataset && (
                    <div className="text-center py-8">
                      <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Please select a dataset first to upload and test models
                      </p>
                    </div>
                  )}

                  {/* Upload Custom Model Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Upload Custom Model</h2>
                    <div className="flex flex-col items-center justify-center w-full">
                      <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        loading 
                          ? 'bg-gray-100 dark:bg-gray-600 border-gray-400'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {loading ? (
                            <>
                              <Loader2 className="w-8 h-8 mb-3 text-indigo-500 animate-spin" />
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Uploading model...
                              </p>
                            </>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400" />
                              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Supported formats: .h5, .pt, .pth, .onnx, .pkl (max 1GB)
                              </p>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept=".h5,.pt,.pth,.onnx,.pkl"
                          onChange={handleModelUpload}
                          disabled={loading}
                        />
                      </label>
                      {successMessage && (
                        <div className="mt-4 text-sm text-green-500 flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                          {successMessage}
                        </div>
                      )}
                      {error && (
                        <div className="mt-4 text-sm text-red-500 flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                          {error}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected Models Section */}
                  {selectedModels.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Selected Models</h2>
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
                            disabled={selectedModels.length === 0}
                          >
                            <Info className="w-5 h-5" />
                            <span>{selectedModels.length === 1 ? 'Evaluate Model' : 'Evaluate Models'}</span>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedModels.map((model) => (
                          <div key={model.modelName} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold">{model.modelName}</h3>
                                <div className="mt-2 space-y-1">
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Type: {model.fromLibrary ? 'Library Model' : 'Custom Model'}
                                  </p>
                                  {model.metrics && (
                                    <>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Accuracy: {(model.metrics.accuracy * 100).toFixed(2)}%
                                      </p>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Latency: {model.metrics.latency}ms
                                      </p>
                                    </>
                                  )}
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
                    </div>
                  )}
                </div>
              </Tab.Panel>

              {/* Results Panel */}
              <Tab.Panel>
                <div id="results-section" className="space-y-6">
                    {comparisonResults.length === 0 ? (
                        <div className="text-center py-8">
                            <GitCompare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                {loading ? 'Evaluating models...' : 'Select models and click "Evaluate Models" to see results'}
                            </p>
                            {error && (
                                <p className="text-red-500 mt-2">
                                    {error}
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Single Model Analysis */}
                            {comparisonResults.length === 1 && (
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                                        Model Performance Analysis: {comparisonResults[0].modelName}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {/* Accuracy Card */}
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Accuracy</h4>
                                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                                {(comparisonResults[0].metrics.accuracy * 100).toFixed(2)}%
                                            </p>
                                        </div>
                                        {/* F1 Score Card */}
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">F1 Score</h4>
                                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                                {(comparisonResults[0].metrics.f1Score * 100).toFixed(2)}%
                                            </p>
                                        </div>
                                        {/* Precision Card */}
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Precision</h4>
                                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                                {(comparisonResults[0].metrics.precision * 100).toFixed(2)}%
                                            </p>
                                        </div>
                                        {/* Recall Card */}
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Recall</h4>
                                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                                {(comparisonResults[0].metrics.recall * 100).toFixed(2)}%
                                            </p>
                                        </div>
                                        {/* Latency Card */}
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Latency</h4>
                                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                                {comparisonResults[0].metrics.latency.toFixed(2)}ms
                                            </p>
                                        </div>
                                        {/* Throughput Card */}
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Throughput</h4>
                                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                                {comparisonResults[0].metrics.throughput.toFixed(2)} req/s
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Single Model Radar Chart */}
                                    <div className="mt-8">
                                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                            Performance Overview
                                        </h4>
                                        <RadarChart data={comparisonResults} />
                                    </div>
                                </div>
                            )}

                            {/* Multiple Models Comparison (existing code) */}
                            {comparisonResults.length > 1 && (
                                <>
                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                                            Model Performance Comparison
                                        </h3>
                                        <div className="space-y-8">
                                            <ComparisonChart
                                                data={comparisonResults}
                                                metric="accuracy"
                                                title="Accuracy"
                                                formatValue={(v) => `${(v * 100).toFixed(2)}%`}
                                            />
                                            <ComparisonChart
                                                data={comparisonResults}
                                                metric="f1Score"
                                                title="F1 Score"
                                                formatValue={(v) => `${(v * 100).toFixed(2)}%`}
                                            />
                                            <ComparisonChart
                                                data={comparisonResults}
                                                metric="precision"
                                                title="Precision"
                                                formatValue={(v) => `${(v * 100).toFixed(2)}%`}
                                            />
                                            <ComparisonChart
                                                data={comparisonResults}
                                                metric="recall"
                                                title="Recall"
                                                formatValue={(v) => `${(v * 100).toFixed(2)}%`}
                                            />
                                            <ComparisonChart
                                                data={comparisonResults}
                                                metric="latency"
                                                title="Latency"
                                                formatValue={(v) => `${v.toFixed(2)}ms`}
                                            />
                                            <ComparisonChart
                                                data={comparisonResults}
                                                metric="throughput"
                                                title="Throughput"
                                                formatValue={(v) => `${v.toFixed(2)} req/s`}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                                            Overall Performance Analysis
                                        </h3>
                                        <RadarChart data={comparisonResults} />
                                    </div>
                                </>
                            )}

                            {/* Detailed Results Table (always show) */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                    {comparisonResults.length === 1 ? 'Detailed Results' : 'Detailed Comparison Results'}
                                </h3>
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
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {comparisonResults.map((result, index) => (
                                                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/50' : ''}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                        {result.modelName}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {(result.metrics.accuracy * 100).toFixed(2)}%
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {(result.metrics.f1Score * 100).toFixed(2)}%
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {(result.metrics.precision * 100).toFixed(2)}%
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {(result.metrics.recall * 100).toFixed(2)}%
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {result.metrics.latency.toFixed(2)}ms
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {result.metrics.throughput.toFixed(2)} req/s
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </div>
  );
};

export default UnifiedBenchmarkPage;