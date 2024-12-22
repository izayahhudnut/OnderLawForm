import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, Fields, Files } from 'formidable';
import * as fs from 'fs/promises';
import { createReadStream } from 'fs';
import * as path from 'path';
import * as os from 'os';
import fetch from 'node-fetch';
import FormData from 'form-data';

interface FormidableFile {
  filepath: string;
  originalFilename: string | null;
  newFilename: string;
  mimetype: string | null;
  size: number;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const tmpDir = path.join(os.tmpdir(), 'uploads');
    await fs.mkdir(tmpDir, { recursive: true });

    const form = new IncomingForm({
      uploadDir: tmpDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024,
    });

    const [fields, files] = await new Promise<[Fields, Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parsing error:', err);
          reject(err);
          return;
        }
        resolve([fields, files]);
      });
    });

    // Create a new FormData instance for sending to Zapier
    const formData = new FormData();

    // Add all the regular fields
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (item !== undefined && item !== null) {
              formData.append(key, String(item));
            }
          });
        } else {
          formData.append(key, String(value));
        }
      }
    });

    // Process and add files
    for (const [fieldName, file] of Object.entries(files)) {
      const currentFile = Array.isArray(file) ? file[0] : file;
      
      if (!currentFile) {
        console.log(`No file data for ${fieldName}`);
        continue;
      }

      try {
        // Create a read stream for the file
        const fileStream = createReadStream(currentFile.filepath);
        
        // Append file to FormData with proper headers
        formData.append(`files.${fieldName}`, fileStream, {
          filename: currentFile.originalFilename || undefined,
          contentType: currentFile.mimetype || undefined
        });

        console.log(`Added file to payload: ${fieldName}`, {
          name: currentFile.originalFilename,
          type: currentFile.mimetype,
          size: currentFile.size
        });

      } catch (error) {
        console.error(`Error processing file ${fieldName}:`, error);
      }
    }

    console.log('Sending files to Zapier...');

    // Send to Zapier as multipart/form-data
    const zapierResponse = await fetch('https://hooks.zapier.com/hooks/catch/14035339/28moaq8/', {
      method: 'POST',
      body: formData
    });

    // Now clean up the temporary files
    for (const [fieldName, file] of Object.entries(files)) {
      const currentFile = Array.isArray(file) ? file[0] : file;
      if (currentFile && currentFile.filepath) {
        await fs.unlink(currentFile.filepath).catch(err => {
          console.error(`Error deleting temp file for ${fieldName}:`, err);
        });
      }
    }

    const responseText = await zapierResponse.text();
    console.log('Zapier response:', responseText);

    return res.status(200).json({
      message: 'Form submitted successfully',
      zapierStatus: zapierResponse.status,
      filesProcessed: Object.keys(files),
      fieldsProcessed: Object.keys(fields)
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      message: 'Error processing form submission',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}