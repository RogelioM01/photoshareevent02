import { v2 as cloudinary } from 'cloudinary';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file path and directory for local storage
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary with environment variables (optional for development)
const hasCloudinaryConfig = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (hasCloudinaryConfig) {
  cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
  });
  console.log('Cloudinary configured successfully with cloud_name:', process.env.CLOUDINARY_CLOUD_NAME);
} else {
  console.log('⚠️ Cloudinary not configured - using local storage fallback');
}

// Cloud storage provider is Cloudinary + Local fallback
// Local storage is always available as fallback option

export interface UploadResult {
  success: boolean;
  url: string;
  provider: 'cloudinary' | 'local';
  error?: string;
}

export class CloudinaryStorage {
  /**
   * Create organized folder structure: year/month/username
   * Example: 2025/01/sofia, 2025/01/javier
   */
  private createEventFolderName(eventId: string, eventTitle?: string, ownerUsername?: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Extract username from eventTitle or use ownerUsername
    let username = 'user';
    
    if (ownerUsername) {
      // Use provided username (preferred)
      username = this.sanitizeUsername(ownerUsername);
    } else if (eventTitle) {
      // Extract from title and sanitize
      username = this.sanitizeUsername(eventTitle);
    }
    
    // Create organized path: year/month/username
    return `${year}/${month}/${username}`;
  }

  /**
   * Sanitize username for folder name (keep it short and clean)
   */
  private sanitizeUsername(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric
      .substring(0, 8); // Keep max 8 characters for short names
  }

  /**
   * Upload file to Cloudinary with Supabase fallback
   */
  /**
   * Local storage fallback - save file to uploads directory
   */
  private async saveToLocalStorage(file: Express.Multer.File, fileName: string): Promise<UploadResult> {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename with extension
      const fileExt = path.extname(file.originalname);
      const uniqueFileName = `${fileName}${fileExt}`;
      const filePath = path.join(uploadsDir, uniqueFileName);

      // Write file to disk
      fs.writeFileSync(filePath, file.buffer);

      // Return local URL (accessible via /uploads endpoint)
      const localUrl = `/uploads/${uniqueFileName}`;
      console.log('Local storage successful:', localUrl);

      return {
        success: true,
        url: localUrl,
        provider: 'local'
      };
    } catch (error) {
      console.error('Local storage failed:', error);
      return {
        success: false,
        url: '',
        provider: 'local',
        error: `Local storage failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    options: {
      folder?: string;
      fileName?: string;
      resourceType?: 'image' | 'video' | 'raw' | 'auto';
      eventId?: string;
      eventTitle?: string;
      ownerUsername?: string;
    } = {}
  ): Promise<UploadResult> {
    const { folder = 'photos', fileName, resourceType = 'auto', eventId, eventTitle, ownerUsername } = options;
    
    // Create organized folder structure: year/month/username
    const eventFolder = eventId ? this.createEventFolderName(eventId, eventTitle, ownerUsername) : folder;
    
    // Generate filename for all providers
    const uniqueFileName = fileName || `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}`;

    // Try Cloudinary first if configured
    if (hasCloudinaryConfig) {
      try {
        console.log(`Attempting Cloudinary upload for: ${file.originalname}`);
        
        const cloudinaryResult = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
          {
            folder: eventFolder,
            public_id: uniqueFileName,
            resource_type: resourceType,
            quality: 'auto:good',
            fetch_format: 'auto'
          }
        );

        console.log('Cloudinary upload successful:', {
          public_id: cloudinaryResult.public_id,
          url: cloudinaryResult.secure_url,
          bytes: cloudinaryResult.bytes,
          format: cloudinaryResult.format,
          folder: eventFolder
        });

        return {
          success: true,
          url: cloudinaryResult.secure_url,
          provider: 'cloudinary'
        };
        
      } catch (cloudinaryError) {
        console.error('Cloudinary upload failed:', cloudinaryError);
        console.log('🔧 Skipping Cloudinary and using fallback storage...');
      }
    }

    // Cloudinary failed, fall back to local storage

    // Final fallback: local storage
    console.log('Falling back to local storage...');
    return await this.saveToLocalStorage(file, uniqueFileName);
  }

  /**
   * Upload multiple files with proper error handling
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    options: {
      folder?: string;
      resourceType?: 'image' | 'video' | 'raw' | 'auto';
      eventId?: string;
      eventTitle?: string;
      ownerUsername?: string;
    } = {}
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file, index) => 
      this.uploadFile(file, {
        ...options,
        fileName: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}-${file.originalname.replace(/\.[^/.]+$/, "")}`
      })
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Delete file from storage provider (Cloudinary, Supabase, or local)
   */
  async deleteFile(fileUrl: string): Promise<boolean> {
    // Handle local file deletion
    if (fileUrl.startsWith('/uploads/')) {
      try {
        const fileName = path.basename(fileUrl);
        const filePath = path.join(process.cwd(), 'uploads', fileName);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Local file deleted successfully:', filePath);
          return true;
        } else {
          console.log('Local file not found:', filePath);
          return true; // Consider success if file doesn't exist
        }
      } catch (error) {
        console.error('Error deleting local file:', error);
        return false;
      }
    }

    // Handle Cloudinary deletion
    if (hasCloudinaryConfig && fileUrl.includes('cloudinary.com')) {
      try {
        const publicId = this.extractPublicIdFromUrl(fileUrl);
        
        if (!publicId) {
          console.error('Unable to extract public ID from URL:', fileUrl);
          return false;
        }
        
        console.log('Attempting to delete file with public ID:', publicId);
        
        const result = await cloudinary.uploader.destroy(publicId);
        console.log('Cloudinary delete result:', result);
        
        return result.result === 'ok';
      } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        return false;
      }
    }

    // No other cloud storage providers configured

    console.log('Unknown file URL format, unable to delete:', fileUrl);
    return false;
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  private extractPublicIdFromUrl(url: string): string | null {
    try {
      // Cloudinary URLs have format: https://res.cloudinary.com/[cloud]/[resource_type]/[type]/[transformations]/[version]/[public_id].[format]
      const match = url.match(/\/v\d+\/(.+)\.[^.]+$/);
      if (match) {
        return match[1];
      }
      
      // Alternative format without version
      const match2 = url.match(/\/upload\/(.+)\.[^.]+$/);
      if (match2) {
        return match2[1];
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting public ID from URL:', error);
      return null;
    }
  }

  /**
   * Get optimized URL for an image
   */
  getOptimizedUrl(publicId: string, options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
  } = {}): string {
    const { width = 800, height = 600, crop = 'limit', quality = 'auto' } = options;
    
    return cloudinary.url(publicId, {
      width,
      height,
      crop,
      quality,
      fetch_format: 'auto'
    });
  }

  /**
   * Get video thumbnail URL
   */
  getVideoThumbnailUrl(publicId: string, options: {
    width?: number;
    height?: number;
    quality?: string;
    timeOffset?: string;
  } = {}): string {
    const { width = 400, height = 300, quality = 'auto', timeOffset = '2' } = options;
    
    return cloudinary.url(publicId, {
      resource_type: 'video',
      width,
      height,
      crop: 'fill',
      quality,
      format: 'jpg',
      start_offset: timeOffset // Get frame at 2 seconds
    });
  }

  /**
   * Get all files from a specific event folder (using new structure)
   */
  async getEventFiles(eventId: string, eventTitle?: string, ownerUsername?: string): Promise<any[]> {
    try {
      const folderName = this.createEventFolderName(eventId, eventTitle, ownerUsername);
      
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folderName,
        max_results: 500
      });

      return result.resources || [];
    } catch (error) {
      console.error('Failed to get event files from Cloudinary:', error);
      return [];
    }
  }

  /**
   * Delete all files from a specific event folder (using new structure)
   */
  async deleteEventFolder(eventId: string, eventTitle?: string, ownerUsername?: string): Promise<boolean> {
    try {
      const folderName = this.createEventFolderName(eventId, eventTitle, ownerUsername);
      
      // Get all files in the folder
      const files = await this.getEventFiles(eventId, eventTitle, ownerUsername);
      
      if (files.length === 0) {
        console.log(`No files found in folder: ${folderName}`);
        return true;
      }

      // Delete all files
      const publicIds = files.map(file => file.public_id);
      const result = await cloudinary.api.delete_resources(publicIds);
      
      console.log(`Deleted ${publicIds.length} files from folder: ${folderName}`);
      return true;
    } catch (error) {
      console.error('Failed to delete event folder from Cloudinary:', error);
      return false;
    }
  }

  /**
   * Get files from all user folders across different months/years
   */
  async getUserFiles(username: string): Promise<any[]> {
    try {
      const sanitizedUsername = this.sanitizeUsername(username);
      
      // Search for all files with username in path (across all years/months)
      const result = await cloudinary.search
        .expression(`folder:*/${sanitizedUsername}`)
        .max_results(500)
        .execute();

      return result.resources || [];
    } catch (error) {
      console.error('Failed to get user files from Cloudinary:', error);
      return [];
    }
  }

  /**
   * Get organized folder structure for admin view
   */
  async getFolderStructure(): Promise<any> {
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
      const currentPath = `${currentYear}/${currentMonth}`;
      
      // Get current month's folders
      const result = await cloudinary.api.sub_folders(currentPath);
      
      return {
        currentPath,
        folders: result.folders || [],
        totalFolders: result.folders?.length || 0
      };
    } catch (error) {
      console.error('Failed to get folder structure from Cloudinary:', error);
      const currentYear = new Date().getFullYear();
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
      const currentPath = `${currentYear}/${currentMonth}`;
      
      return {
        currentPath,
        folders: [],
        totalFolders: 0
      };
    }
  }
}

export const cloudinaryStorage = new CloudinaryStorage();