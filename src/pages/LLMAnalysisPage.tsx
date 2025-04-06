import React, { useState } from 'react';
import { api } from '../services/api';

interface LLMAnalysisResult {
    status: string;
    generated_text?: string;
    metrics?: {
        input_length: number;
        output_length: number;
        response_time: number;
        expansion_ratio: number;
    };
    error?: string;
}

interface LLMEvaluationResult {
    status: string;
    results?: Array<{
        prompt: string;
        generated: string;
        expected: string;
        similarity: number;
        response_time: number;
        expansion_ratio: number;
    }>;
    summary_metrics?: {
        average_similarity: number;
        average_response_time: number;
        average_expansion_ratio: number;
    };
    error?: string;
    
}

const LLMAnalysisPage: React.FC = () => {
    const [modelFile, setModelFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState('');
    const [maxLength, setMaxLength] = useState(100);
    const [analysisResult, setAnalysisResult] = useState<LLMAnalysisResult | null>(null);
    const [evaluationResult, setEvaluationResult] = useState<LLMEvaluationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [testData, setTestData] = useState<Array<{ prompt: string; expected: string }>>([]);

    const handleModelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setModelFile(file);
            const formData = new FormData();
            formData.append('file', file);

            try {
                setLoading(true);
                const response = await fetch('http://localhost:5000/api/llm/upload', {
                    method: 'POST',
                    body: formData,
                });
                const data = await response.json();
                if (data.error) {
                    setError(data.error);
                } else {
                    setError(null);
                }
            } catch (err) {
                setError('Failed to upload model');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAnalyze = async () => {
        if (!prompt) {
            setError('Please enter a prompt');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/llm/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    max_length: maxLength,
                }),
            });
            const data: LLMAnalysisResult = await response.json();
            setAnalysisResult(data);
            setError(null);
        } catch (err) {
            setError('Failed to analyze prompt');
        } finally {
            setLoading(false);
        }
    };

    const handleEvaluate = async () => {
        if (testData.length === 0) {
            setError('Please add test cases');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/llm/evaluate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    test_data: testData,
                }),
            });
            const data: LLMEvaluationResult = await response.json();
            setEvaluationResult(data);
            setError(null);
        } catch (err) {
            setError('Failed to evaluate model');
        } finally {
            setLoading(false);
        }
    };

    const addTestCase = () => {
        setTestData([...testData, { prompt: '', expected: '' }]);
    };

    const updateTestCase = (index: number, field: 'prompt' | 'expected', value: string) => {
        const newTestData = [...testData];
        newTestData[index][field] = value;
        setTestData(newTestData);
    };

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-2xl font-bold">LLM Analysis</h1>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Model Upload</h2>
                <input
                    type="file"
                    accept=".h5,.pt,.pth"
                    onChange={handleModelUpload}
                    className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                />
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Text Generation Analysis</h2>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your prompt here..."
                    className="w-full p-2 border rounded"
                    rows={4}
                />
                <div className="flex items-center space-x-2">
                    <label>Max Length:</label>
                    <input
                        type="number"
                        value={maxLength}
                        onChange={(e) => setMaxLength(Number(e.target.value))}
                        className="w-20 p-1 border rounded"
                        min={1}
                        max={1000}
                    />
                </div>
                <button
                    onClick={handleAnalyze}
                    disabled={loading || !prompt}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {loading ? 'Analyzing...' : 'Analyze'}
                </button>

                {analysisResult && (
                    <div className="mt-4 p-4 bg-gray-50 rounded">
                        <h3 className="text-lg font-semibold mb-2">Analysis Results</h3>
                        {analysisResult.status === 'success' ? (
                            <div className="space-y-2">
                                <p className="font-semibold">Generated Text:</p>
                                <p className="bg-white p-2 rounded">{analysisResult.generated_text}</p>
                                {analysisResult.metrics && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <p>Input Length: {analysisResult.metrics.input_length}</p>
                                        <p>Output Length: {analysisResult.metrics.output_length}</p>
                                        <p>Response Time: {analysisResult.metrics.response_time.toFixed(2)}s</p>
                                        <p>Expansion Ratio: {analysisResult.metrics.expansion_ratio.toFixed(2)}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-red-600">{analysisResult.error}</p>
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Model Evaluation</h2>
                <div className="space-y-2">
                    {testData.map((test, index) => (
                        <div key={index} className="space-y-2 p-4 border rounded">
                            <input
                                type="text"
                                value={test.prompt}
                                onChange={(e) => updateTestCase(index, 'prompt', e.target.value)}
                                placeholder="Enter prompt"
                                className="w-full p-2 border rounded"
                            />
                            <input
                                type="text"
                                value={test.expected}
                                onChange={(e) => updateTestCase(index, 'expected', e.target.value)}
                                placeholder="Enter expected output"
                                className="w-full p-2 border rounded"
                            />
                        </div>
                    ))}
                    <button
                        onClick={addTestCase}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        Add Test Case
                    </button>
                </div>
                <button
                    onClick={handleEvaluate}
                    disabled={loading || testData.length === 0}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {loading ? 'Evaluating...' : 'Evaluate Model'}
                </button>

                {evaluationResult && (
                    <div className="mt-4 p-4 bg-gray-50 rounded">
                        <h3 className="text-lg font-semibold mb-2">Evaluation Results</h3>
                        {evaluationResult.status === 'success' ? (
                            <div className="space-y-4">
                                {evaluationResult.summary_metrics && (
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-2 bg-white rounded">
                                            <p className="font-semibold">Average Similarity</p>
                                            <p>{(evaluationResult.summary_metrics.average_similarity * 100).toFixed(2)}%</p>
                                        </div>
                                        <div className="p-2 bg-white rounded">
                                            <p className="font-semibold">Average Response Time</p>
                                            <p>{evaluationResult.summary_metrics.average_response_time.toFixed(2)}s</p>
                                        </div>
                                        <div className="p-2 bg-white rounded">
                                            <p className="font-semibold">Average Expansion Ratio</p>
                                            <p>{evaluationResult.summary_metrics.average_expansion_ratio.toFixed(2)}</p>
                                        </div>
                                    </div>
                                )}
                                {evaluationResult.results && (
                                    <div className="space-y-2">
                                        {evaluationResult.results.map((result, index) => (
                                            <div key={index} className="p-4 bg-white rounded">
                                                <p className="font-semibold">Test Case {index + 1}</p>
                                                <p>Prompt: {result.prompt}</p>
                                                <p>Generated: {result.generated}</p>
                                                <p>Expected: {result.expected}</p>
                                                <p>Similarity: {(result.similarity * 100).toFixed(2)}%</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-red-600">{evaluationResult.error}</p>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <div className="p-2 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}
        </div>
    );
};

export default LLMAnalysisPage;