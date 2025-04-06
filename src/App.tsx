import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import UnifiedBenchmarkPage from './pages/UnifiedBenchmarkPage';
import ModelLibraryPage from './pages/ModelLibraryPage';
import ModelSelectionPage from './pages/ModelSelectionPage';
import ModelAnalysisPage from './pages/ModelAnalysisPage';
import LLMAnalysisPage from './pages/LLMAnalysisPage';
import ModelEvaluationPage from './pages/ModelEvaluationPage';
import { BenchmarkResult } from './types';
import { api } from './services/api';
import { DatasetProvider } from './context/DatasetContext';
import { ModelProvider } from './context/ModelContext';

interface BenchmarkState {
  selectedModels: BenchmarkResult[];
  comparisonResults: BenchmarkResult[];
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [benchmarkState, setBenchmarkState] = useState<BenchmarkState>({
    selectedModels: [],
    comparisonResults: [],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const models = await api.getModels();
        const benchmarks = await api.getBenchmarks();
        setBenchmarkState(prev => ({
          ...prev,
          selectedModels: models,
          comparisonResults: benchmarks,
        }));
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleModelImport = async (model: BenchmarkResult) => {
    try {
      const savedModel = await api.saveModel(model);
      setBenchmarkState(prev => ({
        ...prev,
        selectedModels: [...prev.selectedModels, savedModel],
      }));
    } catch (error) {
      console.error('Error saving model:', error);
    }
  };

  const handleComparisonResults = async (results: BenchmarkResult[]) => {
    try {
      const savedResults = await Promise.all(
        results.map(result => api.saveBenchmark(result))
      );
      setBenchmarkState(prev => ({
        ...prev,
        comparisonResults: savedResults,
      }));
    } catch (error) {
      console.error('Error saving benchmark results:', error);
    }
  };

  return (
    <ModelProvider>
      <DatasetProvider>
        <div className={isDarkMode ? 'dark' : ''}>
          <Navigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route 
              path="/benchmark" 
              element={
                <UnifiedBenchmarkPage 
                  savedState={benchmarkState}
                  onStateChange={setBenchmarkState}
                />
              } 
            />
            <Route 
              path="/model-library" 
              element={
                <ModelLibraryPage 
                  onModelImport={handleModelImport}
                />
              } 
            />
            <Route 
              path="/model-selection" 
              element={<ModelSelectionPage />} 
            />
            <Route 
              path="/results" 
              element={<ModelAnalysisPage />} 
            />
            <Route path="/llm-analysis" element={<LLMAnalysisPage />} />
            <Route path="/model-evaluation" element={<ModelEvaluationPage />} />
          </Routes>
        </div>
      </DatasetProvider>
    </ModelProvider>
  );
}

export default App;