import React, { useState } from 'react';
import { api } from '../services/api';

interface UploadResponse {
    message: string;
    filepath: string;
    columns?: string[];
    shape?: [number, number];
}

interface EvaluationResponse {
    status: string;
    metrics?: {
        accuracy: number;
        precision: number;
        recall: number;
        f1_score: number;
    };
    predictions?: number[];
    message?: string;
}

const ModelUploader: React.FC = () => {
    const [modelFile, setModelFile] = useState<File | null>(null);
    const [datasetFile, setDatasetFile] = useState<File | null>(null);
    const [modelPath, setModelPath] = useState<string>('');
    const [datasetPath, setDatasetPath] = useState<string>('');
    const [evaluationResults, setEvaluationResults] = useState<EvaluationResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTarget, setSelectedTarget] = useState<string>('');
    const [availableColumns, setAvailableColumns] = useState<string[]>([]);
    const [datasetAnalysis, setDatasetAnalysis] = useState<any>(null);

    const handleModelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setModelFile(file);
            const formData = new FormData();
            formData.append('file', file);

            try {
                setLoading(true);
                const response = await fetch('http://localhost:5000/api/upload/model', {
                    method: 'POST',
                    body: formData,
                });
                const data: UploadResponse = await response.json();
                setModelPath(data.filepath);
                setError(null);
            } catch (err) {
                setError('Failed to upload model');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDatasetUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            console.log("Uploading dataset:", {
                name: file.name,
                size: file.size,
                type: file.type
            });
            
            setDatasetFile(file);
            const formData = new FormData();
            formData.append('file', file);

            try {
                setLoading(true);
                setError(null);
                
                const response = await fetch('http://localhost:5000/api/upload-dataset', {
                    method: 'POST',
                    body: formData,
                });
                
                const data = await response.json();
                console.log("Dataset upload response:", data);
                
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to upload dataset');
                }

                if (!data.success) {
                    throw new Error(data.error || 'Failed to process dataset');
                }

                setDatasetPath(data.filepath);
                if (data.columns && Array.isArray(data.columns)) {
                    console.log("Available columns:", data.columns);
                    setAvailableColumns(data.columns);
                    setSelectedTarget('');
                    document.getElementById('target-column-section')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                    throw new Error('No columns found in dataset');
                }
                
                setError(null);
            } catch (err) {
                console.error("Dataset upload error:", err);
                setError(err instanceof Error ? err.message : 'Failed to upload dataset');
                setAvailableColumns([]);
                setSelectedTarget('');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleTargetSelect = async (target: string) => {
        setSelectedTarget(target);
        if (!target) return;

        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/analyze-dataset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    dataset_path: datasetPath,
                    target_column: target
                }),
            });

            const data = await response.json();
            if (response.ok) {
                setDatasetAnalysis(data);
            } else {
                throw new Error(data.message || 'Failed to analyze dataset');
            }
        } catch (err) {
            console.error("Dataset analysis error:", err);
            setError('Failed to analyze dataset');
        } finally {
            setLoading(false);
        }
    };

    const handleEvaluate = async () => {
        if (!modelPath || !datasetPath || !selectedTarget) {
            setError('Please upload both model and dataset files and select a target column');
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('model_file', modelFile);
            formData.append('target_variable', selectedTarget);
            formData.append('dataset_path', datasetPath);

            const response = await fetch('http://localhost:5000/api/evaluate-model', {
                method: 'POST',
                body: formData,
            });
            
            const data: EvaluationResponse = await response.json();
            if (data.success) {
                setEvaluationResults(data);
                setError(null);
            } else {
                setError(data.message || 'Evaluation failed');
            }
        } catch (err) {
            setError('Failed to evaluate model');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 space-y-4">
            <div className="space-y-2">
                <h2 className="text-xl font-bold">Dataset Upload</h2>
                <p className="text-sm text-gray-600">Upload your dataset (.csv, .xlsx, .xls)</p>
                <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleDatasetUpload}
                    className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                />
                {loading && <p className="text-sm text-gray-500">Uploading dataset...</p>}
            </div>

            {availableColumns.length > 0 && (
                <div id="target-column-section" className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h2 className="text-xl font-bold">Select Target Column</h2>
                    <p className="text-sm text-gray-600 mb-2">Choose the target variable (label) for analysis</p>
                    <select
                        value={selectedTarget}
                        onChange={(e) => handleTargetSelect(e.target.value)}
                        className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="">Select a target column...</option>
                        {availableColumns.map((column) => (
                            <option key={column} value={column}>
                                {column}
                            </option>
                        ))}
                    </select>
                    {selectedTarget && (
                        <p className="text-sm text-green-600 mt-2">
                            ✓ Selected target variable: {selectedTarget}
                        </p>
                    )}
                </div>
            )}

            {datasetAnalysis && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold mb-3">Dataset Analysis</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-medium text-gray-700">Basic Statistics</h4>
                            <ul className="mt-2 space-y-1 text-sm">
                                <li>Total Samples: {datasetAnalysis.total_samples}</li>
                                <li>Features: {datasetAnalysis.num_features}</li>
                                <li>Target Classes: {datasetAnalysis.num_classes}</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-700">Target Distribution</h4>
                            <ul className="mt-2 space-y-1 text-sm">
                                {Object.entries(datasetAnalysis.class_distribution || {}).map(([key, value]) => (
                                    <li key={key}>{key}: {value}%</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="p-2 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            <div className="space-y-2 mt-6">
                <h2 className="text-xl font-bold">Model Upload</h2>
                <p className="text-sm text-gray-600">Upload your pre-trained model (.pkl)</p>
                <input
                    type="file"
                    accept=".pkl"
                    onChange={handleModelUpload}
                    disabled={!selectedTarget}
                    className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
                        disabled:opacity-50"
                />
                {!selectedTarget && (
                    <p className="text-sm text-amber-600">Please select a target column before uploading a model</p>
                )}
            </div>

            <button
                onClick={handleEvaluate}
                disabled={loading || !modelPath || !datasetPath || !selectedTarget}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
                {loading ? 'Evaluating...' : 'Evaluate Model'}
            </button>

            {evaluationResults && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                    <h3 className="text-lg font-semibold mb-2">Evaluation Results</h3>
                    {evaluationResults.status === 'success' && evaluationResults.metrics ? (
                        <div className="space-y-2">
                            <p>Accuracy: {evaluationResults.metrics.accuracy.toFixed(4)}</p>
                            <p>Precision: {evaluationResults.metrics.precision.toFixed(4)}</p>
                            <p>Recall: {evaluationResults.metrics.recall.toFixed(4)}</p>
                            <p>F1 Score: {evaluationResults.metrics.f1_score.toFixed(4)}</p>
                        </div>
                    ) : (
                        <p className="text-red-600">{evaluationResults.message}</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ModelUploader; 