import React, { useState } from 'react';
import { BenchmarkResult } from '../types';
import ComparisonChart from '../components/ComparisonChart';
import RadarChart from '../components/RadarChart';

const ModelComparisonPage: React.FC = () => {
  const [selectedModels, setSelectedModels] = useState<BenchmarkResult[]>([]);

  // Mock data for demonstration
  const availableModels: BenchmarkResult[] = [
    {
      modelName: "ResNet50",
      metrics: {
        accuracy: 0.96,
        inferenceTime: 12,
        memoryUsage: 200,
        parameters: 25600000,
        flops: 2.3e9,
        modelSize: 98,
        hardware: {
          cpu: {
            inferenceTime: 20,
            latency: 18,
            throughput: 120,
          },
          gpu: {
            inferenceTime: 4,
            latency: 3,
            throughput: 600,
          },
        },
      },
      framework: "pytorch",
      timestamp: new Date(),
    },
    {
      modelName: "MobileNetV2",
      metrics: {
        accuracy: 0.92,
        inferenceTime: 8,
        memoryUsage: 150,
        parameters: 3500000,
        flops: 1.2e9,
        modelSize: 45,
        hardware: {
          cpu: {
            inferenceTime: 15,
            latency: 12,
            throughput: 150,
          },
          gpu: {
            inferenceTime: 2,
            latency: 1.5,
            throughput: 800,
          },
        },
      },
      framework: "pytorch",
      timestamp: new Date(),
    },
  ];

  const toggleModelSelection = (model: BenchmarkResult) => {
    if (selectedModels.find(m => m.modelName === model.modelName)) {
      setSelectedModels(selectedModels.filter(m => m.modelName !== model.modelName));
    } else {
      setSelectedModels([...selectedModels, model]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Model Comparison
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Available Models
              </h2>
              <div className="space-y-2">
                {availableModels.map((model) => (
                  <label
                    key={model.modelName}
                    className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedModels.some(m => m.modelName === model.modelName)}
                      onChange={() => toggleModelSelection(model)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-gray-900 dark:text-white">
                      {model.modelName}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {selectedModels.length > 0 ? (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Performance Comparison
                  </h3>
                  <div className="space-y-8">
                    <ComparisonChart
                      data={selectedModels}
                      metric="inferenceTime"
                      title="Inference Time (ms)"
                      formatValue={(v) => `${v.toFixed(2)}ms`}
                    />
                    <ComparisonChart
                      data={selectedModels}
                      metric="memoryUsage"
                      title="Memory Usage (MB)"
                      formatValue={(v) => `${v.toFixed(2)}MB`}
                    />
                    <ComparisonChart
                      data={selectedModels}
                      metric="parameters"
                      title="Parameters"
                      formatValue={(v) => v.toLocaleString()}
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Overall Performance
                  </h3>
                  <RadarChart data={selectedModels} />
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Select models from the list to compare their performance
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelComparisonPage;