import React, { createContext, useContext, useState, useEffect } from 'react';

interface DatasetContextType {
    dataset: File | null;
    datasetPath: string | null;
    setDataset: (file: File | null) => void;
    setDatasetPath: (path: string | null) => void;
    clearDataset: () => void;
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [dataset, setDatasetState] = useState<File | null>(null);
    const [datasetPath, setDatasetPathState] = useState<string | null>(null);

    // Load dataset info from localStorage on initial render
    useEffect(() => {
        const savedDatasetPath = localStorage.getItem('datasetPath');
        if (savedDatasetPath) {
            setDatasetPathState(savedDatasetPath);
        }
    }, []);

    const setDataset = (file: File | null) => {
        setDatasetState(file);
        if (!file) {
            localStorage.removeItem('datasetPath');
        }
    };

    const setDatasetPath = (path: string | null) => {
        setDatasetPathState(path);
        if (path) {
            localStorage.setItem('datasetPath', path);
        } else {
            localStorage.removeItem('datasetPath');
        }
    };

    const clearDataset = () => {
        setDatasetState(null);
        setDatasetPathState(null);
        localStorage.removeItem('datasetPath');
    };

    return (
        <DatasetContext.Provider value={{ dataset, datasetPath, setDataset, setDatasetPath, clearDataset }}>
            {children}
        </DatasetContext.Provider>
    );
};

export const useDataset = () => {
    const context = useContext(DatasetContext);
    if (context === undefined) {
        throw new Error('useDataset must be used within a DatasetProvider');
    }
    return context;
}; 