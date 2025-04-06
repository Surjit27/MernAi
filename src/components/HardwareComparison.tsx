import React from 'react';
import { BenchmarkResult } from '../types';
import { Cpu, Cpu as Gpu } from 'lucide-react';

interface HardwareComparisonProps {
  result: BenchmarkResult;
}

const HardwareComparison: React.FC<HardwareComparisonProps> = ({ result }) => {
  const { hardware } = result.metrics;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center mb-4">
          <Cpu className="w-6 h-6 text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold">CPU Performance</h3>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Inference Time</p>
            <p className="text-xl font-semibold">{hardware.cpu.inferenceTime.toFixed(2)}ms</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Latency</p>
            <p className="text-xl font-semibold">{hardware.cpu.latency.toFixed(2)}ms</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Throughput</p>
            <p className="text-xl font-semibold">{hardware.cpu.throughput.toFixed(2)} samples/sec</p>
          </div>
        </div>
      </div>

      {hardware.gpu && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center mb-4">
            <Gpu className="w-6 h-6 text-green-500 mr-2" />
            <h3 className="text-lg font-semibold">GPU Performance</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Inference Time</p>
              <p className="text-xl font-semibold">{hardware.gpu.inferenceTime.toFixed(2)}ms</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Latency</p>
              <p className="text-xl font-semibold">{hardware.gpu.latency.toFixed(2)}ms</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Throughput</p>
              <p className="text-xl font-semibold">{hardware.gpu.throughput.toFixed(2)} samples/sec</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HardwareComparison;