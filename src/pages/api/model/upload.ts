import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { validateModelFile, ModelInfo } from '../../../utils/modelHandler';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ modelInfo: ModelInfo } | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      uploadDir: UPLOADS_DIR,
      keepExtensions: true,
      maxFileSize: 500 * 1024 * 1024, // 500MB
      filter: function ({ name, originalFilename, mimetype }) {
        // Log the file information for debugging
        console.log('Upload attempt:', { name, originalFilename, mimetype });
        
        // Accept all files - we'll validate them later
        return true;
      },
    });

    console.log('Processing upload request...');

    const [fields, files] = await form.parse(req);
    
    // Log what we received
    console.log('Received fields:', fields);
    console.log('Received files:', Object.keys(files));

    const modelFile = files.model?.[0];

    if (!modelFile) {
      console.error('No model file found in request');
      return res.status(400).json({ error: 'No model file provided in the request' });
    }

    if (!modelFile.originalFilename) {
      console.error('No original filename found');
      return res.status(400).json({ error: 'Invalid file upload' });
    }

    console.log('File received:', {
      name: modelFile.originalFilename,
      size: modelFile.size,
      type: modelFile.mimetype,
    });

    // Convert the file to a File object for validation
    const fileBuffer = await fs.promises.readFile(modelFile.filepath);
    const file = new File(
      [fileBuffer],
      modelFile.originalFilename,
      {
        type: modelFile.mimetype || 'application/octet-stream',
      }
    );

    const modelInfo = await validateModelFile(file);

    // Move the file to a permanent location with a unique name
    const finalPath = path.join(UPLOADS_DIR, `${modelInfo.id}.pkl`);
    await fs.promises.rename(modelFile.filepath, finalPath);

    console.log('File successfully processed and moved to:', finalPath);

    return res.status(200).json({ modelInfo });
  } catch (error) {
    console.error('Model upload error:', error);
    
    // Provide more detailed error message
    const errorMessage = error instanceof Error 
      ? `Upload failed: ${error.message}`
      : 'Failed to upload model';

    return res.status(500).json({ error: errorMessage });
  }
} 