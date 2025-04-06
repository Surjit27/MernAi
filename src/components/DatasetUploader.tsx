import React, { useState, useRef } from 'react';
import { Upload, Search, ExternalLink, Loader2, X, AlertCircle } from 'lucide-react';
import { Dataset, ExternalDataset } from '../types';
import { api } from '../services/api';

interface DatasetUploaderProps {
  onDatasetSelect: (dataset: any) => void;
  onUploadSuccess?: (datasetInfo: any) => void;
  onUploadError?: (error: string) => void;
}

const DatasetUploader: React.FC<DatasetUploaderProps> = ({
  onDatasetSelect,
  onUploadSuccess,
  onUploadError,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'local' | 'kaggle' | 'huggingface'>('local');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock external datasets for demonstration
  const externalDatasets: ExternalDataset[] = [
    {
      id: '1',
      name: 'MNIST',
      description: 'Handwritten digits dataset',
      size: 11000000,
      source: 'kaggle',
      url: 'https://www.kaggle.com/datasets/mnist',
      tags: ['computer-vision', 'classification'],
      downloads: 1000000,
      lastUpdated: new Date('2024-01-15'),
    },
    {
      id: '2',
      name: 'CIFAR-10',
      description: 'Image classification dataset',
      size: 170000000,
      source: 'huggingface',
      url: 'https://huggingface.co/datasets/cifar10',
      tags: ['computer-vision', 'classification'],
      downloads: 500000,
      lastUpdated: new Date('2024-02-20'),
    },
  ];

  const handleDatasetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      const errorMsg = 'No file selected';
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    // Validate file type
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validTypes.includes(fileExtension)) {
      const errorMsg = 'Invalid file format. Only .csv, .xlsx, and .xls files are supported.';
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading dataset:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Use the Flask backend URL
      const apiUrl = 'http://localhost:3000/api/upload/dataset';

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let the browser set it with the boundary
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Failed to parse response:', e);
        throw new Error('Server returned invalid JSON response');
      }

      if (!response.ok) {
        throw new Error(data.error || `Upload failed with status: ${response.status}`);
      }

      console.log('Dataset upload successful:', data);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Show success message
      setSuccessMessage('Dataset uploaded successfully');
      setTimeout(() => setSuccessMessage(null), 3000);

      onUploadSuccess?.(data);
    } catch (error) {
      console.error('Dataset upload error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to upload dataset';
      setError(errorMsg);
      onUploadError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newDataset: Dataset = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        format: file.type,
        createdAt: new Date(),
        source: 'local',
      };
      onDatasetSelect(newDataset);
    }
  };

  const handleExternalDatasetSelect = (externalDataset: ExternalDataset) => {
    const newDataset: Dataset = {
      id: externalDataset.id,
      name: externalDataset.name,
      description: externalDataset.description,
      size: externalDataset.size || 0,
      format: 'application/zip',
      createdAt: externalDataset.lastUpdated || new Date(),
      source: externalDataset.source,
      sourceUrl: externalDataset.url,
      metadata: {
        tags: externalDataset.tags,
        downloads: externalDataset.downloads,
      },
    };
    onDatasetSelect(newDataset);
  };

  const filteredDatasets = externalDatasets.filter(dataset =>
    dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dataset.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex space-x-2">
        <button
          onClick={() => setActiveTab('local')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'local'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          Local Upload
        </button>
        <button
          onClick={() => setActiveTab('kaggle')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'kaggle'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          Kaggle
        </button>
        <button
          onClick={() => setActiveTab('huggingface')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'huggingface'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          Hugging Face
        </button>
      </div>

      {activeTab === 'local' ? (
        <div className="w-full">
          <div className="border-2 border-dashed rounded-xl p-8 text-center border-gray-300 dark:border-gray-700">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Upload your dataset (.csv, .xlsx, .xls)
            </p>
            <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Uploading...
                </span>
              ) : (
                'Select Dataset'
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleDatasetUpload}
                disabled={loading}
              />
            </label>
          </div>

          {error && (
            <div className="mt-4 flex items-center space-x-2 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'kaggle' ? 'Kaggle' : 'Hugging Face'} datasets...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            />
          </div>

          <div className="grid gap-4">
            {filteredDatasets
              .filter(dataset => dataset.source === activeTab)
              .map(dataset => (
                <div
                  key={dataset.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {dataset.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {dataset.description}
                      </p>
                    </div>
                    <a
                      href={dataset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {dataset.tags?.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {dataset.downloads?.toLocaleString()} downloads
                    </span>
                    <button
                      onClick={() => handleExternalDatasetSelect(dataset)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Select Dataset
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetUploader;