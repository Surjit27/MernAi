import numpy as np
import tensorflow as tf
import torch
import os
import pickle
from typing import Dict, Any, Union, Tuple
import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

class ModelEvaluator:
    def __init__(self):
        self.supported_formats = ['.h5', '.pt', '.pth', '.pkl', '.onnx']
        self.upload_dir = 'uploads'
        os.makedirs(self.upload_dir, exist_ok=True)

    def load_model(self, model_path: str) -> Union[tf.keras.Model, torch.nn.Module]:
        """Load a model from file based on its extension."""
        try:
            if model_path.endswith('.h5'):
                return tf.keras.models.load_model(model_path)
            elif model_path.endswith(('.pt', '.pth')):
                return torch.load(model_path)
            elif model_path.endswith('.pkl'):
                with open(model_path, 'rb') as f:
                    return pickle.load(f)
            elif model_path.endswith('.onnx'):
                # Add ONNX loading logic here if needed
                raise NotImplementedError("ONNX support not yet implemented")
            else:
                raise ValueError(f"Unsupported model format. Supported formats: {self.supported_formats}")
        except Exception as e:
            print(f"Error loading model from {model_path}: {str(e)}")
            raise

    def load_dataset(self, dataset_path: str, target_column: str = None) -> Tuple[np.ndarray, np.ndarray]:
        """
        Load and preprocess dataset from CSV or Excel file.
        
        Args:
            dataset_path: Path to the dataset file
            target_column: Name of the target column. If None, uses the last column.
        """
        try:
            print(f"Loading dataset from: {dataset_path}")
            
            # Load the dataset based on file extension
            if dataset_path.endswith('.csv'):
                df = pd.read_csv(dataset_path)
            elif dataset_path.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(dataset_path)
            else:
                raise ValueError("Unsupported dataset format. Supported formats: .csv, .xlsx, .xls")

            print(f"Dataset loaded successfully. Shape: {df.shape}")
            print(f"Available columns: {list(df.columns)}")

            # Basic dataset validation
            if df.empty:
                raise ValueError("Dataset is empty")

            if df.shape[1] < 2:
                raise ValueError("Dataset must have at least two columns (features and target)")

            # Handle target column selection
            if target_column is not None:
                if target_column not in df.columns:
                    raise ValueError(f"Target column '{target_column}' not found in dataset. Available columns: {list(df.columns)}")
                # Extract target and remove it from features
                y = df[target_column].values
                X = df.drop(columns=[target_column])
            else:
                # Default behavior: use last column as target
                print("No target column specified, using last column as target")
                X = df.iloc[:, :-1]
                y = df.iloc[:, -1].values

            print(f"Features shape: {X.shape}, Labels shape: {y.shape}")
            
            # Handle categorical variables in features
            categorical_columns = X.select_dtypes(include=['object']).columns
            for column in categorical_columns:
                X[column] = pd.Categorical(X[column]).codes
            
            # Convert to numpy array
            X = X.values
            
            # Basic feature validation
            if not isinstance(X, np.ndarray):
                X = np.array(X)
            if not isinstance(y, np.ndarray):
                y = np.array(y)

            # Convert features to float type
            X = X.astype(float)
            
            # Handle categorical target if needed
            if y.dtype == object:
                y = pd.Categorical(y).codes

            print("Dataset preprocessing completed successfully")
            return X, y
            
        except Exception as e:
            print(f"Error loading dataset: {str(e)}")
            raise ValueError(f"Failed to load dataset: {str(e)}")

    def get_dataset_info(self, dataset_path: str) -> Dict[str, Any]:
        """Get information about the dataset including column names."""
        try:
            print(f"Reading dataset info from: {dataset_path}")
            
            # Load the dataset based on file extension
            if dataset_path.endswith('.csv'):
                df = pd.read_csv(dataset_path)
            elif dataset_path.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(dataset_path)
            else:
                raise ValueError("Unsupported dataset format. Supported formats: .csv, .xlsx, .xls")

            # Get basic dataset information
            info = {
                'columns': list(df.columns),
                'shape': df.shape,
                'dtypes': df.dtypes.astype(str).to_dict(),
                'has_missing_values': df.isnull().any().tolist(),
                'numeric_columns': list(df.select_dtypes(include=['int64', 'float64']).columns)
            }
            
            return info
        except Exception as e:
            print(f"Error getting dataset info: {str(e)}")
            raise ValueError(f"Failed to get dataset info: {str(e)}")

    def evaluate_model(self, model_path: str, dataset_path: str, target_column: str = None) -> Dict[str, Any]:
        """Evaluate a model on a given dataset."""
        try:
            # Load model and dataset
            print(f"Loading model from {model_path}")
            model = self.load_model(model_path)
            print(f"Loading dataset from {dataset_path} with target column: {target_column}")
            X, y = self.load_dataset(dataset_path, target_column)

            # Make predictions
            print("Making predictions...")
            if isinstance(model, tf.keras.Model):
                predictions = model.predict(X)
                predictions = np.argmax(predictions, axis=1)
            elif isinstance(model, torch.nn.Module):
                model.eval()
                with torch.no_grad():
                    X_tensor = torch.FloatTensor(X)
                    predictions = model(X_tensor)
                    predictions = torch.argmax(predictions, dim=1).numpy()
            else:  # Handle scikit-learn or similar models (including pickled models)
                try:
                    # Try predict_proba first for classifiers
                    predictions = model.predict_proba(X)
                    predictions = np.argmax(predictions, axis=1)
                except (AttributeError, NotImplementedError):
                    # Fall back to regular predict for other models
                    predictions = model.predict(X)

            # Calculate metrics
            print("Calculating metrics...")
            metrics = {
                'accuracy': float(accuracy_score(y, predictions)),
                'precision': float(precision_score(y, predictions, average='weighted')),
                'recall': float(recall_score(y, predictions, average='weighted')),
                'f1_score': float(f1_score(y, predictions, average='weighted'))
            }

            return {
                'status': 'success',
                'metrics': metrics,
                'predictions': predictions.tolist()
            }
        except Exception as e:
            print(f"Error during model evaluation: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }

    def save_uploaded_file(self, file, file_type: str) -> str:
        """Save uploaded file and return its path."""
        try:
            # Create type-specific subdirectory
            type_dir = os.path.join(self.upload_dir, file_type + 's')
            os.makedirs(type_dir, exist_ok=True)

            # Generate unique filename
            filename = f"{file_type}_{os.urandom(8).hex()}{os.path.splitext(file.filename)[1]}"
            filepath = os.path.join(type_dir, filename)
            
            print(f"Saving {file_type} file to: {filepath}")
            file.save(filepath)
            
            return filepath
        except Exception as e:
            print(f"Error saving uploaded file: {str(e)}")
            raise 