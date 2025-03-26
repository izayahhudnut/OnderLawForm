import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import * as fs from 'fs/promises';
import { createReadStream } from 'fs';
import * as path from 'path';
import * as os from 'os';
import fetch from 'node-fetch';
import FormData from 'form-data';

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

    // Parse the form with formidable
    const form = new IncomingForm({
      uploadDir: tmpDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024,
      multiples: true,
      allowEmptyFiles: true,
      minFileSize: 0,
    });

    // Parse the incoming form
    const formData = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const { fields, files } = formData as { fields: Record<string, string | string[]>; files: Record<string, { filepath: string; originalFilename?: string; size: number; mimetype?: string }> };
    
    // Create a new FormData for Zapier
    const zapierFormData = new FormData();
    
    // Add all form fields with trimming for text values
    Object.entries(fields).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => {
          // Trim string values
          const processedValue = typeof v === 'string' ? v.trim() : v;
          zapierFormData.append(key, processedValue);
        });
      } else {
        // Trim string values
        const processedValue = typeof value === 'string' ? value.trim() : value;
        zapierFormData.append(key, processedValue);
      }
    });
    
    // Process files
    if (files) {
      try {
        // Log the files structure for debugging
        console.log('Files received:', Object.keys(files));
        
        for (const [fieldName, fileObj] of Object.entries(files)) {
          try {
            const file = Array.isArray(fileObj) ? fileObj[0] : fileObj;
            
            // Skip files that don't exist or have no size
            if (!file || !file.filepath) {
              console.log(`Skipping ${fieldName}: No file data`);
              continue;
            }
            
            // Check file size
            if (file.size <= 0) {
              console.log(`Skipping ${fieldName}: Empty file (size: ${file.size})`);
              continue;
            }
            
            // Create and add file stream
            console.log(`Processing file ${fieldName}: ${file.originalFilename} (${file.size} bytes)`);
            const fileStream = createReadStream(file.filepath);
            zapierFormData.append(fieldName, fileStream, {
              filename: file.originalFilename || `${fieldName}.file`,
              contentType: file.mimetype || 'application/octet-stream'
            });
          } catch (error) {
            console.error(`Error processing file ${fieldName}:`, error);
          }
        }
      } catch (error) {
        console.error('Error in file processing loop:', error);
      }
    }
    
    // Send to Zapier
    const zapierResponse = await fetch('https://hooks.zapier.com/hooks/catch/14035339/28moaq8/', {
      method: 'POST',
      body: zapierFormData
    });
    
    // Clean up temp files
    if (files) {
      try {
        console.log('Cleaning up temporary files...');
        for (const fileObj of Object.values(files)) {
          const file = Array.isArray(fileObj) ? fileObj[0] : fileObj;
          if (file && file.filepath) {
            try {
              // Check if file exists before deleting
              await fs.access(file.filepath);
              await fs.unlink(file.filepath);
              console.log(`Deleted temp file: ${file.filepath}`);
            } catch (error) {
              console.error(`Error cleaning up temp file ${file.filepath}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('Error in cleanup loop:', error);
      }
    }
    
    if (zapierResponse.ok) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(500).json({ error: 'Failed to submit to Zapier' });
    }
    
  } catch (error) {
    console.error('Error processing form submission:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}