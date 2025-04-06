import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'datasets');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      uploadDir: UPLOADS_DIR,
      keepExtensions: true,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      filter: function ({ name, originalFilename, mimetype }) {
        // Log the file information for debugging
        console.log('Upload attempt:', { name, originalFilename, mimetype });
        
        // Check file extension
        if (!originalFilename) return false;
        const ext = path.extname(originalFilename).toLowerCase();
        return ['.csv', '.xlsx', '.xls'].includes(ext);
      },
    });

    console.log('Processing dataset upload request...');

    const [fields, files] = await form.parse(req);
    
    // Log what we received
    console.log('Received fields:', fields);
    console.log('Received files:', Object.keys(files));

    const uploadedFile = files.file?.[0];

    if (!uploadedFile) {
      console.error('No file found in request');
      return res.status(400).json({ error: 'No file part' });
    }

    if (!uploadedFile.originalFilename) {
      console.error('No original filename found');
      return res.status(400).json({ error: 'Invalid file upload' });
    }

    console.log('File received:', {
      name: uploadedFile.originalFilename,
      size: uploadedFile.size,
      type: uploadedFile.mimetype,
    });

    // Generate a unique filename
    const fileId = Date.now().toString();
    const ext = path.extname(uploadedFile.originalFilename);
    const finalFilename = `dataset_${fileId}${ext}`;
    const finalPath = path.join(UPLOADS_DIR, finalFilename);

    // Move the file to its final location
    await fs.promises.rename(uploadedFile.filepath, finalPath);

    console.log('File successfully processed and moved to:', finalPath);

    // Return the dataset information
    return res.status(200).json({
      id: fileId,
      filename: finalFilename,
      originalName: uploadedFile.originalFilename,
      size: uploadedFile.size,
      type: uploadedFile.mimetype,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Dataset upload error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to upload dataset',
    });
  }
} 