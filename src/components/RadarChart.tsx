import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { BenchmarkResult } from '../types';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface RadarChartProps {
  data: BenchmarkResult[];
}

const RadarChart: React.FC<RadarChartProps> = ({ data }) => {
  const metrics = [
    'accuracy',
    'inferenceTime',
    'memoryUsage',
    'parameters',
    'flops',
    'modelSize',
  ];

  const normalizeValue = (value: number, metric: string) => {
    const allValues = data.map(d => d.metrics[metric]);
    const max = Math.max(...allValues);
    return (value / max) * 100;
  };

  const chartData = {
    labels: metrics.map(m => m.charAt(0).toUpperCase() + m.slice(1)),
    datasets: data.map((result, index) => ({
      label: result.modelName,
      data: metrics.map(metric => normalizeValue(result.metrics[metric], metric)),
      backgroundColor: `rgba(79, 70, 229, ${0.2 + (index * 0.2)})`,
      borderColor: `rgba(79, 70, 229, ${0.8 + (index * 0.1)})`,
      borderWidth: 2,
    })),
  };

  const options = {
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(128, 128, 128, 0.2)',
        },
        grid: {
          color: 'rgba(128, 128, 128, 0.2)',
        },
        ticks: {
          backdropColor: 'transparent',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div className="w-full h-[400px] flex items-center justify-center">
      <Radar data={chartData} options={options} />
    </div>
  );
};

export default RadarChart;