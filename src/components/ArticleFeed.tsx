import React from 'react';
import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  summary: string;
  date: Date;
  category: string;
  url: string;
  imageUrl: string;
}

const ArticleFeed: React.FC = () => {
  // Mock data for demonstration
  const articles: Article[] = [
    {
      id: '1',
      title: 'New Breakthrough in Transformer Architecture',
      summary: 'Researchers develop a more efficient attention mechanism that reduces computational complexity while maintaining performance.',
      date: new Date('2024-03-20'),
      category: 'Research',
      url: '#',
      imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: '2',
      title: 'Optimizing LLMs for Edge Devices',
      summary: 'Latest techniques for running large language models on resource-constrained devices with minimal performance impact.',
      date: new Date('2024-03-19'),
      category: 'Technology',
      url: '#',
      imageUrl: 'https://images.unsplash.com/photo-1676371824413-aeaaa8e7c0c0?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: '3',
      title: 'Benchmarking Tools Evolution',
      summary: 'How modern ML benchmarking tools are adapting to new model architectures and deployment scenarios.',
      date: new Date('2024-03-18'),
      category: 'Tools',
      url: '#',
      imageUrl: 'https://images.unsplash.com/photo-1675557009875-436f7865c290?auto=format&fit=crop&q=80&w=400',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Latest in Machine Learning
        </h2>
        <div className="space-y-6">
          {articles.map((article) => (
            <div key={article.id} className="flex space-x-4">
              <div className="flex-shrink-0 w-24 h-24">
                <img
                  src={article.imageUrl}
                  alt=""
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                    {article.category}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {format(article.date, 'MMM d, yyyy')}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {article.title}
                </h3>
                <p className="mt-1 text-gray-500 dark:text-gray-400 line-clamp-2">
                  {article.summary}
                </p>
                <a
                  href={article.url}
                  className="mt-2 inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                >
                  Read more
                  <ExternalLink className="ml-1 w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArticleFeed;