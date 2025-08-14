import { Client, Storage, Account, ID } from 'appwrite';

// Appwrite configuration
export const appwriteConfig = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID!,
  bucketId: import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID!,
};


// Initialize Appwrite client
const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

// Initialize services
export const storage = new Storage(client);
export const account = new Account(client);

// Storage service functions
export const storageService = {
  // Upload file to Appwrite storage
  async uploadFile(file: File): Promise<string> {
    try {
      const fileId = ID.unique();
      const response = await storage.createFile(
        appwriteConfig.bucketId,
        fileId,
        file
      );
      
      // Return the file URL
      return this.getFileUrl(response.$id);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  },

  // Get file URL
  getFileUrl(fileId: string): string {
    return `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucketId}/files/${fileId}/view?project=${appwriteConfig.projectId}`;
  },

  // Delete file from storage
  async deleteFile(fileId: string): Promise<void> {
    try {
      await storage.deleteFile(appwriteConfig.bucketId, fileId);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  },

  // Upload multiple files
  async uploadMultipleFiles(files: File[]): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file));
      const urls = await Promise.all(uploadPromises);
      return urls;
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw new Error('Failed to upload files');
    }
  }
};