import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, GitCompare, Database, ArrowRight } from 'lucide-react';
import ArticleFeed from '../components/ArticleFeed';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BarChart3,
      title: 'Self Model Benchmarking',
      description: 'Analyze your model\'s performance metrics in detail',
      path: '/self-benchmark',
      color: 'bg-blue-500',
    },
    {
      icon: GitCompare,
      title: 'Model Comparison',
      description: 'Compare multiple models side by side with visual analysis',
      path: '/model-comparison',
      color: 'bg-purple-500',
    },
    {
      icon: Database,
      title: 'Dataset Comparison',
      description: 'Test your model across different datasets',
      path: '/dataset-comparison',
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            AI Model Benchmarking
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Comprehensive performance analysis and comparison tools for your AI models
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="relative group bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => navigate(feature.path)}
              >
                <div className={`inline-flex p-3 rounded-lg ${feature.color}`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                  {feature.description}
                </p>
                <div className="mt-4 flex items-center text-indigo-600 dark:text-indigo-400">
                  <span className="text-sm font-medium">Get started</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-2" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Why Use Our Benchmarking Tool?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Comprehensive Analysis
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Get detailed insights into your model's performance, including accuracy, inference time, and resource usage.
                  </p>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Visual Comparisons
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Compare models side by side with interactive charts and visualizations.
                  </p>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Multi-Dataset Testing
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Evaluate your model's performance across different datasets to ensure robustness.
                  </p>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    LLM Analysis
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Get AI-powered insights and recommendations based on your model's performance metrics.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <ArticleFeed />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;