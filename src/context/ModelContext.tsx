import React, { createContext, useContext, useState, useEffect } from 'react';
import { BenchmarkResult } from '../types';

interface ModelContextType {
    selectedModels: BenchmarkResult[];
    addModel: (model: BenchmarkResult) => void;
    removeModel: (modelName: string) => void;
    clearModels: () => void;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const ModelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedModels, setSelectedModels] = useState<BenchmarkResult[]>([]);

    // Load selected models from localStorage on initial render
    useEffect(() => {
        const savedModels = localStorage.getItem('selectedModels');
        if (savedModels) {
            setSelectedModels(JSON.parse(savedModels));
        }
    }, []);

    const addModel = (model: BenchmarkResult) => {
        setSelectedModels(prev => {
            // Check if model already exists
            const exists = prev.some(m => m.modelName === model.modelName);
            if (exists) {
                return prev; // Don't add if already exists
            }
            const newModels = [...prev, model];
            localStorage.setItem('selectedModels', JSON.stringify(newModels));
            return newModels;
        });
    };

    const removeModel = (modelName: string) => {
        setSelectedModels(prev => {
            // Find the first occurrence of the model with this name
            const index = prev.findIndex(m => m.modelName === modelName);
            if (index === -1) return prev; // Model not found
            
            // Create new array without the specific model instance
            const newModels = [...prev.slice(0, index), ...prev.slice(index + 1)];
            localStorage.setItem('selectedModels', JSON.stringify(newModels));
            return newModels;
        });
    };

    const clearModels = () => {
        setSelectedModels([]);
        localStorage.removeItem('selectedModels');
    };

    return (
        <ModelContext.Provider value={{ selectedModels, addModel, removeModel, clearModels }}>
            {children}
        </ModelContext.Provider>
    );
};

export const useModel = () => {
    const context = useContext(ModelContext);
    if (context === undefined) {
        throw new Error('useModel must be used within a ModelProvider');
    }
    return context;
};

export default ModelProvider; 