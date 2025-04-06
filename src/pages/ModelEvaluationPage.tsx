import React, { useState } from 'react';
import { Box, Typography, Button, FormControl, InputLabel, Select, MenuItem, CircularProgress, Paper, Card, CardContent, Grid, FormHelperText } from '@mui/material';

interface DatasetInfo {
  columns: string[];
  shape: [number, number];
  numeric_columns: string[];
  dtypes: { [key: string]: string };
  filepath: string;
  filename: string;
}

interface ModelInfo {
  filepath: string;
  filename: string;
}

interface EvaluationResult {
  status: string;
  metrics?: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
  };
  message?: string;
}

export default function ModelEvaluationPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

  const handleDatasetUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError('Please select a dataset file');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log(`Uploading dataset: ${file.name}`);
      const response = await fetch('/api/upload/dataset', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload dataset');
      }

      console.log('Dataset upload success:', data);
      setDatasetInfo({
        columns: data.columns,
        shape: data.shape,
        numeric_columns: data.numeric_columns,
        dtypes: data.dtypes,
        filepath: data.filepath,
        filename: file.name
      });
      
      // Reset target selection when new dataset is uploaded
      setSelectedTarget('');
      setEvaluationResult(null);
    } catch (err: any) {
      console.error('Dataset upload error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError('Please select a model file');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log(`Uploading model: ${file.name}`);
      const response = await fetch('/api/upload/model', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload model');
      }

      console.log('Model upload success:', data);
      setModelInfo({
        filepath: data.filepath,
        filename: file.name
      });
      setEvaluationResult(null);
    } catch (err: any) {
      console.error('Model upload error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!modelInfo?.filepath || !datasetInfo) {
      setError('Please upload both a model and dataset first');
      return;
    }

    if (!selectedTarget) {
      setError('Please select a target column');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`Evaluating model with target column: ${selectedTarget}`);
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_path: modelInfo.filepath,
          dataset_path: datasetInfo.filepath,
          target_column: selectedTarget
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Evaluation failed');
      }

      console.log('Evaluation result:', data);
      setEvaluationResult(data);
    } catch (err: any) {
      console.error('Evaluation error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        Model Evaluation
      </Typography>

      {error && (
        <Paper 
          sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }} 
          elevation={0}
        >
          <Typography>{error}</Typography>
        </Paper>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                1. Upload Dataset
              </Typography>
              <Box mb={2}>
                <Button
                  variant="contained"
                  component="label"
                  disabled={loading}
                  fullWidth
                >
                  {datasetInfo ? `Change Dataset (${datasetInfo.filename})` : 'Upload Dataset (.csv, .xlsx, .xls)'}
                  <input
                    type="file"
                    hidden
                    onChange={handleDatasetUpload}
                    accept=".csv,.xlsx,.xls"
                  />
                </Button>
              </Box>

              {datasetInfo && (
                <Box mt={2}>
                  <FormControl fullWidth>
                    <InputLabel id="target-column-label">Target Column</InputLabel>
                    <Select
                      labelId="target-column-label"
                      value={selectedTarget}
                      label="Target Column"
                      onChange={(e) => setSelectedTarget(e.target.value)}
                    >
                      {datasetInfo.columns.map((column) => (
                        <MenuItem key={column} value={column}>
                          {column}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      Select the target variable (label) for model evaluation
                    </FormHelperText>
                  </FormControl>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                3. Upload Model
              </Typography>
              <Box mb={2}>
                <Button
                  variant="contained"
                  component="label"
                  disabled={loading}
                  fullWidth
                >
                  {modelInfo ? `Change Model (${modelInfo.filename})` : 'Upload Model (.h5, .pt, .pth, .pkl, .onnx)'}
                  <input
                    type="file"
                    hidden
                    onChange={handleModelUpload}
                    accept=".h5,.pt,.pth,.pkl,.onnx"
                  />
                </Button>
              </Box>
              
              <Box mt={4}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleEvaluate}
                  disabled={loading || !modelInfo || !datasetInfo || !selectedTarget}
                  fullWidth
                  size="large"
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : '4. Evaluate Model'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {evaluationResult && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Evaluation Results
            </Typography>
            
            {evaluationResult.status === 'success' ? (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Model Performance Metrics:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">Accuracy</Typography>
                      <Typography variant="h6">{(evaluationResult.metrics?.accuracy * 100).toFixed(2)}%</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">Precision</Typography>
                      <Typography variant="h6">{(evaluationResult.metrics?.precision * 100).toFixed(2)}%</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">Recall</Typography>
                      <Typography variant="h6">{(evaluationResult.metrics?.recall * 100).toFixed(2)}%</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">F1 Score</Typography>
                      <Typography variant="h6">{(evaluationResult.metrics?.f1_score * 100).toFixed(2)}%</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Typography color="error">
                {evaluationResult.message || 'Evaluation failed'}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
} 