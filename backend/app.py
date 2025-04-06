from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import json
from werkzeug.utils import secure_filename
from model_evaluator import ModelEvaluator
from llm_analyzer import LLMAnalyzer
import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, recall_score, f1_score, confusion_matrix, precision_score
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
import io
import base64
from tensorflow import keras

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'h5', 'pt', 'pth', 'pkl', 'onnx', 'csv', 'xlsx', 'xls', 'json'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize evaluators
evaluator = ModelEvaluator()
llm_analyzer = LLMAnalyzer()

# In-memory storage for demonstration purposes
# In a production environment, you would use a database
benchmark_results = []
model_library = []

# Global variables to store the data and model
global_dataset = None
global_target = None

def allowed_file(filename, file_type):
    """Check if the file extension is allowed."""
    if not filename or '.' not in filename:
        print(f"Invalid filename: {filename}")
        return False

    extension = filename.rsplit('.', 1)[1].lower()
    print(f"Checking file: {filename}, type: {file_type}, extension: {extension}")

    if file_type == 'model':
        allowed = extension in {'h5', 'pt', 'pth', 'pkl', 'onnx'}
        print(f"Model file check - Extension: {extension}, Allowed: {allowed}")
        return allowed
    elif file_type == 'dataset':
        allowed = extension in {'csv', 'xlsx', 'xls'}
        print(f"Dataset file check - Extension: {extension}, Allowed: {allowed}")
        return allowed
    elif file_type == 'llm_test':
        allowed = extension == 'json'
        print(f"LLM test file check - Extension: {extension}, Allowed: {allowed}")
        return allowed
    
    print(f"Unknown file type: {file_type}")
    return False

@app.route('/')
def home():
    return render_template('upload.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    global global_dataset
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'})
    
    if file and file.filename.endswith('.csv'):
        try:
            # Read the CSV file
            global_dataset = pd.read_csv(file)
            
            # Get column names
            columns = global_dataset.columns.tolist()
            
            # Get first few rows for preview
            preview = global_dataset.head().to_html(classes='table table-striped')
            
            return jsonify({
                'success': True,
                'columns': columns,
                'preview': preview
            })
        except Exception as e:
            return jsonify({'error': f'Error processing file: {str(e)}'})
    
    return jsonify({'error': 'Invalid file format'})

@app.route('/train', methods=['POST'])
def train():
    global global_dataset
    
    if global_dataset is None:
        return jsonify({'error': 'No dataset uploaded'})
    
    try:
        # Get target column from request
        target_column = request.json.get('target_column')
        if target_column not in global_dataset.columns:
            return jsonify({'error': 'Invalid target column'})
        
        # Prepare the data
        X = global_dataset.drop(target_column, axis=1)
        y = global_dataset[target_column]
        
        # Handle categorical variables in features
        categorical_columns = X.select_dtypes(include=['object']).columns
        for column in categorical_columns:
            le = LabelEncoder()
            X[column] = le.fit_transform(X[column].astype(str))
        
        # Handle categorical target variable
        if y.dtype == 'object':
            le = LabelEncoder()
            y = le.fit_transform(y)
        
        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train model (using Random Forest as an example)
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        # Make predictions
        y_pred = model.predict(X_test)
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted')
        f1 = f1_score(y_test, y_pred, average='weighted')
        
        return jsonify({
            'success': True,
            'metrics': {
                'accuracy': round(accuracy * 100, 2),
                'precision': round(precision * 100, 2),
                'f1_score': round(f1 * 100, 2)
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Error during training: {str(e)}'})

@app.route('/api/upload/model', methods=['POST'])
def upload_model():
    print("Received model upload request")
    print("Files in request:", list(request.files.keys()))
    
    if 'file' not in request.files:
        print("No file part in request")
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    print(f"Received file: {file.filename}, Content Type: {file.content_type}")
    
    if file.filename == '':
        print("No selected file (empty filename)")
        return jsonify({'error': 'No selected file'}), 400
    
    if not allowed_file(file.filename, 'model'):
        print(f"Invalid file type: {file.filename}")
        return jsonify({'error': 'Invalid file type. Supported formats: .h5, .pt, .pth, .pkl, .onnx'}), 400
    
    try:
        # Log the upload attempt
        print(f"Attempting to upload model: {file.filename}")
        filepath = evaluator.save_uploaded_file(file, 'model')
        print(f"Model saved successfully at: {filepath}")
        return jsonify({
            'message': 'Model uploaded successfully',
            'filepath': filepath
        }), 201
    except Exception as e:
        print(f"Error uploading model: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload-dataset', methods=['POST'])
def upload_dataset():
    print("Received dataset upload request")
    
    if 'file' not in request.files:
        print("No file part in request")
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    print(f"Received file: {file.filename}, Content Type: {file.content_type}")
    
    if file.filename == '':
        print("No selected file (empty filename)")
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename, 'dataset'):
        print(f"Invalid file type: {file.filename}")
        return jsonify({'error': 'Invalid file type. Supported formats: .csv, .xlsx, .xls'}), 400
    
    try:
        # Create uploads directory if it doesn't exist
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        
        # Save the uploaded file with a secure filename
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        print(f"File saved at: {filepath}")
        
        # Read the dataset to get information
        if filepath.endswith('.csv'):
            df = pd.read_csv(filepath)
        elif filepath.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(filepath)
        else:
            raise ValueError("Unsupported file format")
            
        print(f"Dataset loaded successfully. Shape: {df.shape}")
        print(f"Columns: {df.columns.tolist()}")
        
        # Get dataset information
        dataset_info = {
            'columns': df.columns.tolist(),
            'shape': df.shape,
            'dtypes': df.dtypes.astype(str).to_dict(),
            'numeric_columns': df.select_dtypes(include=['int64', 'float64']).columns.tolist(),
            'preview': df.head().to_dict()
        }
        
        response_data = {
            'success': True,
            'message': 'Dataset uploaded successfully',
            'filepath': filepath,
            'filename': filename,
            **dataset_info
        }
        
        print(f"Sending response: {response_data}")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error processing dataset: {str(e)}")
        # Clean up the file if there was an error
        if 'filepath' in locals() and os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({'error': f'Error processing dataset: {str(e)}'}), 500

@app.route('/api/analyze-dataset', methods=['POST'])
def analyze_dataset():
    try:
        data = request.json
        dataset_path = data.get('dataset_path')
        target_column = data.get('target_column')

        if not dataset_path or not target_column:
            return jsonify({'error': 'Dataset path and target column are required'}), 400

        # Load the dataset
        if dataset_path.endswith('.csv'):
            df = pd.read_csv(dataset_path)
        elif dataset_path.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(dataset_path)
        else:
            return jsonify({'error': 'Unsupported file format'}), 400

        if target_column not in df.columns:
            return jsonify({'error': f'Target column {target_column} not found in dataset'}), 400

        # Basic statistics
        total_samples = len(df)
        num_features = len(df.columns) - 1  # excluding target column
        
        # Target analysis
        target_values = df[target_column]
        num_classes = len(target_values.unique())
        
        # Calculate class distribution
        class_distribution = (target_values.value_counts(normalize=True) * 100).round(2).to_dict()
        
        # Feature analysis
        numeric_features = df.select_dtypes(include=['int64', 'float64']).columns.tolist()
        categorical_features = df.select_dtypes(include=['object']).columns.tolist()
        
        # Missing values analysis
        missing_values = df.isnull().sum().to_dict()

        analysis_results = {
            'total_samples': total_samples,
            'num_features': num_features,
            'num_classes': num_classes,
            'class_distribution': class_distribution,
            'feature_types': {
                'numeric': numeric_features,
                'categorical': categorical_features
            },
            'missing_values': missing_values,
            'target_column': target_column
        }

        return jsonify(analysis_results)

    except Exception as e:
        print(f"Error analyzing dataset: {str(e)}")
        return jsonify({'error': f'Error analyzing dataset: {str(e)}'}), 500

@app.route('/api/set-target', methods=['POST'])
def set_target_variable():
    global global_target
    
    data = request.json
    if not data or 'target_variable' not in data:
        return jsonify({'error': 'No target variable specified'}), 400
    
    target_variable = data['target_variable']
    
    if global_dataset is None:
        return jsonify({'error': 'Please upload a dataset first'}), 400
    
    if target_variable not in global_dataset.columns:
        return jsonify({'error': 'Invalid target variable'}), 400
    
    global_target = target_variable
    
    return jsonify({
        'success': True,
        'message': f'Target variable set to {target_variable}'
    })

@app.route('/api/evaluate-model', methods=['POST'])
def evaluate_model():
    if 'model_file' not in request.files:
        return jsonify({'error': 'No model file provided'}), 400
    
    if 'target_variable' not in request.form:
        return jsonify({'error': 'No target variable specified'}), 400
    
    try:
        model_file = request.files['model_file']
        target_variable = request.form['target_variable']
        
        # Save the uploaded model file
        model_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(model_file.filename))
        model_file.save(model_path)
        
        # Get the dataset path from the request
        dataset_path = request.form.get('dataset_path')
        if not dataset_path:
            return jsonify({'error': 'Dataset path not provided'}), 400
            
        # Use the ModelEvaluator to evaluate the model
        result = evaluator.evaluate_model(model_path, dataset_path, target_variable)
        
        # Clean up the temporary model file
        if os.path.exists(model_path):
            os.remove(model_path)
            
        if result['status'] == 'error':
            return jsonify({'error': result['message']}), 500
            
        return jsonify({
            'success': True,
            'metrics': result['metrics'],
            'predictions': result.get('predictions', [])
        })
        
    except Exception as e:
        return jsonify({'error': f'Error evaluating model: {str(e)}'}), 500

@app.route('/api/benchmark', methods=['GET', 'POST'])
def handle_benchmark():
    if request.method == 'POST':
        data = request.json
        benchmark_results.append(data)
        return jsonify({"message": "Benchmark result saved successfully", "data": data}), 201
    else:
        return jsonify(benchmark_results)

@app.route('/api/models', methods=['GET', 'POST'])
def handle_models():
    if request.method == 'POST':
        data = request.json
        model_library.append(data)
        return jsonify({"message": "Model saved successfully", "data": data}), 201
    else:
        return jsonify(model_library)

@app.route('/api/analysis', methods=['POST'])
def handle_analysis():
    data = request.json
    # Here you would typically perform some analysis on the data
    # For now, we'll just return a mock response
    return jsonify({
        "message": "Analysis completed",
        "results": {
            "performance_metrics": {
                "accuracy": 0.95,
                "latency": 120,
                "throughput": 1000
            }
        }
    })

# LLM Analysis endpoints
@app.route('/api/llm/upload', methods=['POST'])
def upload_llm_model():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if not allowed_file(file.filename, 'model'):
        return jsonify({'error': 'Invalid file type. Supported formats: .h5, .pt, .pth, .pkl, .onnx'}), 400
    
    try:
        # Log the upload attempt
        print(f"Attempting to upload LLM model: {file.filename}")
        filepath = llm_analyzer.save_uploaded_file(file, 'llm_model')
        result = llm_analyzer.load_llm_model(filepath)
        if result is not True:
            return jsonify({'error': result}), 500
        print(f"LLM model saved successfully at: {filepath}")
        return jsonify({
            'message': 'LLM model loaded successfully',
            'filepath': filepath
        }), 201
    except Exception as e:
        print(f"Error uploading LLM model: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/llm/analyze', methods=['POST'])
def analyze_llm():
    try:
        data = request.json
        prompt = data.get('prompt')
        max_length = data.get('max_length', 100)
        
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400
        
        result = llm_analyzer.analyze_text_generation(prompt, max_length)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/llm/evaluate', methods=['POST'])
def evaluate_llm():
    try:
        data = request.json
        test_data = data.get('test_data', [])
        
        if not test_data:
            return jsonify({'error': 'Test data is required'}), 400
        
        result = llm_analyzer.evaluate_llm_performance(test_data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dataset/info/<path:dataset_path>', methods=['GET'])
def get_dataset_info(dataset_path):
    """Get information about a dataset including its columns."""
    try:
        # Ensure the path is within the uploads directory
        full_path = os.path.join(app.config['UPLOAD_FOLDER'], dataset_path)
        if not os.path.exists(full_path):
            return jsonify({'error': 'Dataset not found'}), 404
        
        dataset_info = evaluator.get_dataset_info(full_path)
        return jsonify(dataset_info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=3000) 