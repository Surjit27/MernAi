import React, { useState } from 'react';
import { Upload, FileDown, Loader2 } from 'lucide-react';
import { ModelMetrics } from '../types';
import HardwareComparison from '../components/HardwareComparison';

const SelfBenchmarkPage: React.FC = () => {
  const [model, setModel] = useState<File | null>(null);
  const [dataset, setDataset] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleModelDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.pt') || file.name.endsWith('.h5') || file.name.endsWith('.onnx'))) {
      setModel(file);
    }
  };

  const handleDatasetDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      setDataset(file);
    }
  };

  const runBenchmark = async () => {
    if (!model || !dataset) return;

    setIsProcessing(true);
    
    // Simulate benchmark process
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockMetrics: ModelMetrics = {
      accuracy: 0.95 + Math.random() * 0.03,
      inferenceTime: 15 + Math.random() * 5,
      memoryUsage: 256 + Math.random() * 100,
      parameters: 1000000 + Math.random() * 500000,
      flops: 2.5e9 + Math.random() * 1e9,
      modelSize: 250 + Math.random() * 100,
      hardware: {
        cpu: {
          inferenceTime: 25 + Math.random() * 10,
          latency: 20 + Math.random() * 8,
          throughput: 100 + Math.random() * 50,
        },
        gpu: {
          inferenceTime: 5 + Math.random() * 3,
          latency: 3 + Math.random() * 2,
          throughput: 500 + Math.random() * 200,
        },
      },
    };

    setMetrics(mockMetrics);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Self Model Benchmarking
        </h1>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Upload Model</h2>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center ${
                dragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-700'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleModelDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Upload your AI model
              </p>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Supported formats: .pt, .h5, .onnx
              </p>
              <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
                Select Model
                <input
                  type="file"
                  className="hidden"
                  accept=".pt,.h5,.onnx"
                  onChange={(e) => e.target.files && setModel(e.target.files[0])}
                />
              </label>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Upload Dataset</h2>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center ${
                dragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-700'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDatasetDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Upload your dataset
              </p>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Upload test dataset for benchmarking
              </p>
              <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
                Select Dataset
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files && setDataset(e.target.files[0])}
                />
              </label>
            </div>
          </div>

          <button
            onClick={runBenchmark}
            disabled={!model || !dataset || isProcessing}
            className={`w-full px-8 py-3 rounded-lg text-white transition-colors ${
              !model || !dataset || isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processing...
              </span>
            ) : (
              'Run Benchmark'
            )}
          </button>

          {metrics && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Results</h2>
                <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <FileDown className="w-5 h-5 mr-2" />
                  Export Report
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Accuracy</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {(metrics.accuracy * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Model Size</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {metrics.modelSize.toFixed(2)} MB
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">FLOPs</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {(metrics.flops / 1e9).toFixed(2)}G
                  </p>
                </div>
              </div>

              <HardwareComparison result={{ modelName: model.name, metrics, framework: 'pytorch', timestamp: new Date() }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelfBenchmarkPage;