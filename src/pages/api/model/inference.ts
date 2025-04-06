import { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const PYTHON_SCRIPT = path.join(process.cwd(), 'scripts', 'inference.py');

// Ensure Python script exists
const PYTHON_SCRIPT_CONTENT = `
import sys
import pickle
import json

def load_model(model_path):
    with open(model_path, 'rb') as f:
        return pickle.load(f)

def run_inference(model, input_data):
    try:
        # Here you would typically:
        # 1. Preprocess the input
        # 2. Run the model
        # 3. Post-process the output
        result = model.predict([input_data])[0]  # Simplified example
        return result
    except Exception as e:
        return str(e)

if __name__ == '__main__':
    model_path = sys.argv[1]
    input_data = sys.argv[2]
    
    model = load_model(model_path)
    result = run_inference(model, input_data)
    print(json.dumps({'result': str(result)}))
`;

if (!fs.existsSync(path.dirname(PYTHON_SCRIPT))) {
  fs.mkdirSync(path.dirname(PYTHON_SCRIPT), { recursive: true });
}
if (!fs.existsSync(PYTHON_SCRIPT)) {
  fs.writeFileSync(PYTHON_SCRIPT, PYTHON_SCRIPT_CONTENT);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { modelId, input } = req.body;

    if (!modelId || !input) {
      return res.status(400).json({ error: 'Missing modelId or input' });
    }

    const modelPath = path.join(UPLOADS_DIR, `${modelId}.pkl`);
    if (!fs.existsSync(modelPath)) {
      return res.status(404).json({ error: 'Model not found' });
    }

    // Run Python script for inference
    const python = spawn('python', [
      PYTHON_SCRIPT,
      modelPath,
      JSON.stringify(input),
    ]);

    let result = '';
    let error = '';

    python.stdout.on('data', (data) => {
      result += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    await new Promise((resolve, reject) => {
      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}\n${error}`));
        } else {
          resolve(null);
        }
      });
    });

    if (error) {
      console.error('Python error:', error);
      return res.status(500).json({ error: 'Model inference failed' });
    }

    try {
      const parsedResult = JSON.parse(result);
      return res.status(200).json(parsedResult);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse model output' });
    }
  } catch (error) {
    console.error('Inference error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to run inference',
    });
  }
} 