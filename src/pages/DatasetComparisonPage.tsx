import React, { useState } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { ModelMetrics } from '../types';
import { evaluateModel, KFoldResult, ModelEvaluationResult } from '../utils/modelEvaluation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DatasetValidationResult {
  isValid: boolean;
  error?: string;
  data?: any[];
}

interface Results {
  dataset1Results: ModelEvaluationResult | null;
  dataset2Results: ModelEvaluationResult | null;
}

const validateDataset = async (file: File): Promise<DatasetValidationResult> => {
  if (!file) return { isValid: false, error: 'No file provided' };

  const fileType = file.name.split('.').pop()?.toLowerCase();
  if (!['csv', 'xlsx'].includes(fileType || '')) {
    return { isValid: false, error: 'Invalid file type. Please upload a .csv or .xlsx file' };
  }

  try {
    // For now, we'll just validate the file type
    // In a real implementation, you would parse and validate the file contents here
    return { isValid: true, data: [] };
  } catch (error) {
    return { isValid: false, error: 'Failed to process dataset. Please check the file format.' };
  }
};

const DatasetComparisonPage: React.FC = () => {
  const [model, setModel] = useState<File | null>(null);
  const [dataset1, setDataset1] = useState<File | null>(null);
  const [dataset2, setDataset2] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBuiltInModel, setIsBuiltInModel] = useState(false);
  const [results, setResults] = useState<Results>({
    dataset1Results: null,
    dataset2Results: null,
  });

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check if it's a built-in model based on file extension or other criteria
      setIsBuiltInModel(file.name.endsWith('.mlmodel'));
      setModel(file);
    }
  };

  const handleDatasetUpload = async (e: React.ChangeEvent<HTMLInputElement>, isDataset1: boolean) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validationResult = await validateDataset(file);
      
      if (!validationResult.isValid) {
        setError(validationResult.error || 'Invalid dataset file');
        return;
      }

      if (isDataset1) {
        setDataset1(file);
      } else {
        setDataset2(file);
      }
    }
  };

  const runComparison = async () => {
    if (!model || !dataset1) return;

    setIsProcessing(true);
    setError(null);

    try {
      const dataset1Results = await evaluateModel(model, dataset1, isBuiltInModel);
      let dataset2Results = null;
      
      if (dataset2) {
        dataset2Results = await evaluateModel(model, dataset2, isBuiltInModel);
      }

      setResults({
        dataset1Results,
        dataset2Results,
      });
    } catch (err) {
      setError('Failed to process comparison. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderKFoldChart = (kFoldResults: KFoldResult[], label: string) => {
    const data = {
      labels: kFoldResults.map(r => `Fold ${r.fold}`),
      datasets: [
        {
          label: 'Accuracy',
          data: kFoldResults.map(r => r.accuracy * 100),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
        {
          label: 'Precision',
          data: kFoldResults.map(r => r.precision * 100),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
        {
          label: 'Recall',
          data: kFoldResults.map(r => r.recall * 100),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
        },
        {
          label: 'F1 Score',
          data: kFoldResults.map(r => r.f1Score * 100),
          backgroundColor: 'rgba(255, 206, 86, 0.5)',
        },
      ],
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {label} - K-Fold Cross Validation Results
        </h3>
        <div className="h-[300px]">
          <Bar
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  title: {
                    display: true,
                    text: 'Percentage (%)',
                  },
                },
              },
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              },
            }}
          />
        </div>
      </div>
    );
  };

  const renderMetricsComparison = () => {
    if (!results.dataset1Results) return null;

    const metrics1 = results.dataset1Results.metrics;
    const metrics2 = results.dataset2Results?.metrics;

    const data = {
      labels: ['Accuracy', 'Precision', 'Recall', 'F1 Score'],
      datasets: [
        {
          label: 'Dataset 1',
          data: [
            metrics1.accuracy * 100,
            metrics1.precision * 100,
            metrics1.recall * 100,
            metrics1.f1Score * 100,
          ],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
        ...(metrics2 ? [{
          label: 'Dataset 2',
          data: [
            metrics2.accuracy * 100,
            metrics2.precision * 100,
            metrics2.recall * 100,
            metrics2.f1Score * 100,
          ],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        }] : []),
      ],
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Overall Metrics Comparison
        </h3>
        <div className="h-[300px]">
          <Bar
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  title: {
                    display: true,
                    text: 'Percentage (%)',
                  },
                },
              },
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              },
            }}
          />
        </div>
      </div>
    );
  };

  const renderPerformanceMetrics = (metrics: ModelMetrics, label: string) => {
    const data = {
      labels: ['Inference Time (ms)', 'Memory Usage (MB)', 'Model Size (MB)'],
      datasets: [{
        label,
        data: [metrics.inferenceTime, metrics.memoryUsage, metrics.modelSize],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1,
      }],
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {label} - Performance Metrics
        </h3>
        <div className="h-[300px]">
          <Bar
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Value',
                  },
                },
              },
            }}
          />
        </div>
      </div>
    );
  };

  const renderHardwareComparison = (metrics: ModelMetrics, label: string) => {
    if (!metrics.hardware?.gpu || !metrics.hardware?.cpu) {
      return null;
    }

    const data = {
      labels: ['Inference Time', 'Latency', 'Throughput'],
      datasets: [
        {
          label: 'CPU',
          data: [
            metrics.hardware.cpu.inferenceTime,
            metrics.hardware.cpu.latency,
            metrics.hardware.cpu.throughput,
          ],
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1,
        },
        {
          label: 'GPU',
          data: [
            metrics.hardware.gpu.inferenceTime,
            metrics.hardware.gpu.latency,
            metrics.hardware.gpu.throughput,
          ],
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1,
        },
      ],
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {label} - Hardware Performance
        </h3>
        <div className="h-[300px]">
          <Bar
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Value',
                  },
                },
              },
            }}
          />
        </div>
      </div>
    );
  };

  const renderResourceComparison = () => {
    if (!results.dataset1Results || !results.dataset2Results) return null;

    const metrics1 = results.dataset1Results.metrics;
    const metrics2 = results.dataset2Results.metrics;

    if (!metrics1.hardware?.gpu || !metrics1.hardware?.cpu ||
        !metrics2.hardware?.gpu || !metrics2.hardware?.cpu) {
      return null;
    }

    const data = {
      labels: ['CPU Inference', 'GPU Inference', 'Memory Usage', 'Model Size'],
      datasets: [
        {
          label: 'Dataset 1',
          data: [
            metrics1.hardware.cpu.inferenceTime,
            metrics1.hardware.gpu.inferenceTime,
            metrics1.memoryUsage,
            metrics1.modelSize,
          ],
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1,
        },
        {
          label: 'Dataset 2',
          data: [
            metrics2.hardware.cpu.inferenceTime,
            metrics2.hardware.gpu.inferenceTime,
            metrics2.memoryUsage,
            metrics2.modelSize,
          ],
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1,
        },
      ],
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Resource Utilization Comparison
        </h3>
        <div className="h-[300px]">
          <Bar
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Value',
                  },
                },
              },
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Dataset Comparison
        </h1>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Upload Model</h2>
            <div className="border-2 border-dashed rounded-xl p-8 text-center border-gray-300 dark:border-gray-700">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Upload your AI model
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Supported formats: .pt, .h5, .onnx, .mlmodel
              </p>
              <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
                Select Model
                <input
                  type="file"
                  className="hidden"
                  accept=".pt,.h5,.onnx,.mlmodel"
                  onChange={handleModelUpload}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Dataset 1</h2>
              <div className="border-2 border-dashed rounded-xl p-8 text-center border-gray-300 dark:border-gray-700">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Supported formats: .csv, .xlsx
                </p>
                <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
                  Select Dataset
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx"
                    onChange={(e) => handleDatasetUpload(e, true)}
                  />
                </label>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Dataset 2</h2>
              <div className="border-2 border-dashed rounded-xl p-8 text-center border-gray-300 dark:border-gray-700">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Supported formats: .csv, .xlsx
                </p>
                <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
                  Select Dataset
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx"
                    onChange={(e) => handleDatasetUpload(e, false)}
                  />
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={runComparison}
            disabled={!model || !dataset1 || isProcessing}
            className={`w-full px-8 py-3 rounded-lg text-white transition-colors ${
              !model || !dataset1 || isProcessing
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
              'Run Comparison'
            )}
          </button>

          {results.dataset1Results && (
            <div className="space-y-6 mt-8">
              {(results.dataset1Results.isSimulated || (results.dataset2Results?.isSimulated ?? false)) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start">
                  <div className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0">ℹ️</div>
                  <div>
                    <p className="text-blue-600 dark:text-blue-400 font-medium">Simulated Results</p>
                    <p className="text-blue-500 dark:text-blue-300 mt-1">
                      {isBuiltInModel 
                        ? "This is a built-in model, so performance metrics are simulated with optimistic values."
                        : "No actual model evaluation is performed. These are simulated results for demonstration."}
                    </p>
                  </div>
                </div>
              )}

              {renderMetricsComparison()}
              {renderKFoldChart(results.dataset1Results.kFoldResults, 'Dataset 1')}
              {renderPerformanceMetrics(results.dataset1Results.metrics, 'Dataset 1')}
              {renderHardwareComparison(results.dataset1Results.metrics, 'Dataset 1')}
              
              {results.dataset2Results && (
                <>
                  {renderKFoldChart(results.dataset2Results.kFoldResults, 'Dataset 2')}
                  {renderPerformanceMetrics(results.dataset2Results.metrics, 'Dataset 2')}
                  {renderHardwareComparison(results.dataset2Results.metrics, 'Dataset 2')}
                  {renderResourceComparison()}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatasetComparisonPage;