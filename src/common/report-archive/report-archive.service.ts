import { Injectable } from '@nestjs/common';
import { StorageProvider } from './providers/storage.provider';
import * as path from 'path';

export interface FileMetadata {
  contentType: string;
  patientId?: string;
  reportType?: string;
  [key: string]: any;
}

export interface FileResult {
  success: boolean;
  path?: string;
  content?: Buffer;
  metadata?: FileMetadata;
  error?: string;
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  lastModified: Date;
  metadata?: FileMetadata;
}

export interface ListResult {
  success: boolean;
  files: FileInfo[];
  error?: string;
}

export interface DirectoryResult {
  success: boolean;
  error?: string;
}

@Injectable()
export class ReportArchiveService {
  constructor(private readonly storageProvider: StorageProvider) {}

  async uploadFile(
    filePath: string,
    content: Buffer,
    metadata?: FileMetadata,
  ): Promise<FileResult> {
    try {
      // Validate path
      if (!this.isValidPath(filePath)) {
        throw new Error('Invalid file path');
      }

      // Upload file
      await this.storageProvider.writeFile(filePath, content);

      // Store metadata if provided
      if (metadata) {
        await this.storageProvider.writeMetadata(filePath, metadata);
      }

      return {
        success: true,
        path: filePath,
        metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  async downloadFile(filePath: string): Promise<FileResult> {
    try {
      // Validate path
      if (!this.isValidPath(filePath)) {
        throw new Error('Invalid file path');
      }

      // Check if file exists
      if (!(await this.storageProvider.exists(filePath))) {
        throw new Error('File not found');
      }

      // Read file content
      const content = await this.storageProvider.readFile(filePath);

      // Get metadata if available
      const metadata = await this.storageProvider.readMetadata(filePath);
      const typedMetadata = metadata as FileMetadata | undefined;

      return {
        success: true,
        content,
        metadata: typedMetadata,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
      };
    }
  }

  async deleteFile(filePath: string): Promise<FileResult> {
    try {
      // Validate path
      if (!this.isValidPath(filePath)) {
        throw new Error('Invalid file path');
      }

      // Check if file exists
      if (!(await this.storageProvider.exists(filePath))) {
        throw new Error('File not found');
      }

      // Delete file and its metadata
      await this.storageProvider.deleteFile(filePath);
      await this.storageProvider.deleteMetadata(filePath);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }

  async listFiles(directory: string): Promise<ListResult> {
    try {
      // Validate path
      if (!this.isValidPath(directory)) {
        throw new Error('Invalid directory path');
      }

      // List files in directory
      const files = await this.storageProvider.listFiles(directory);

      // Get metadata for each file
      const fileInfos = await Promise.all(
        files.map(async (file: string) => {
          const stats = await this.storageProvider.getStats(file);
          const metadata = await this.storageProvider.readMetadata(file);
          const typedMetadata = metadata as FileMetadata | undefined;
          return {
            name: path.basename(file),
            path: file,
            size: stats.size,
            lastModified: stats.lastModified,
            metadata: typedMetadata,
          };
        }),
      );

      return {
        success: true,
        files: fileInfos,
      };
    } catch (error) {
      return {
        success: false,
        files: [],
        error: error instanceof Error ? error.message : 'List failed',
      };
    }
  }

  async createDirectory(dirPath: string): Promise<DirectoryResult> {
    try {
      // Validate path
      if (!this.isValidPath(dirPath)) {
        throw new Error('Invalid directory path');
      }

      // Create directory
      await this.storageProvider.createDirectory(dirPath);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Create directory failed',
      };
    }
  }

  async deleteDirectory(dirPath: string): Promise<DirectoryResult> {
    try {
      // Validate path
      if (!this.isValidPath(dirPath)) {
        throw new Error('Invalid directory path');
      }

      // Delete directory recursively
      await this.storageProvider.deleteDirectory(dirPath);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete directory failed',
      };
    }
  }

  async updateMetadata(
    filePath: string,
    metadata: FileMetadata,
  ): Promise<FileResult> {
    try {
      // Validate path
      if (!this.isValidPath(filePath)) {
        throw new Error('Invalid file path');
      }

      // Check if file exists
      if (!(await this.storageProvider.exists(filePath))) {
        throw new Error('File not found');
      }

      // Update metadata
      await this.storageProvider.writeMetadata(filePath, metadata);

      return {
        success: true,
        metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update metadata failed',
      };
    }
  }

  async getMetadata(filePath: string): Promise<FileResult> {
    try {
      // Validate path
      if (!this.isValidPath(filePath)) {
        throw new Error('Invalid file path');
      }

      // Check if file exists
      if (!(await this.storageProvider.exists(filePath))) {
        throw new Error('File not found');
      }

      // Get metadata
      const metadata = await this.storageProvider.readMetadata(filePath);
      const typedMetadata = metadata as FileMetadata | undefined;

      return {
        success: true,
        metadata: typedMetadata,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Get metadata failed',
      };
    }
  }

  private isValidPath(filePath: string): boolean {
    // Normalize path and check if it contains parent directory traversal
    const normalizedPath = path.normalize(filePath);
    return !normalizedPath.includes('..');
  }
}
