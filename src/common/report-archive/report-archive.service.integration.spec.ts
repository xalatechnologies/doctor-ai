import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ReportArchiveService } from './report-archive.service';
import * as fs from 'fs';
import * as path from 'path';
import { StorageProvider } from './providers/storage.provider';

describe('ReportArchiveService Integration', () => {
  let service: ReportArchiveService;
  let storageProvider: StorageProvider;
  let configService: ConfigService;

  const TEST_DIR = 'test-reports';
  const TEST_FILE = 'test-report.pdf';
  const TEST_CONTENT = Buffer.from('Test PDF content');

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportArchiveService,
        StorageProvider,
        {
          provide: ConfigService,
          useValue: new ConfigService(),
        },
      ],
    }).compile();

    service = module.get<ReportArchiveService>(ReportArchiveService);
    storageProvider = module.get<StorageProvider>(StorageProvider);
    configService = module.get<ConfigService>(ConfigService);

    // Initialize storage provider
    await storageProvider.onModuleInit();
  });

  afterAll(async () => {
    // Clean up test directory
    await service.deleteDirectory(TEST_DIR);
    await storageProvider.onModuleDestroy();
  });

  beforeEach(async () => {
    // Clean up test files before each test
    await service.deleteDirectory(TEST_DIR);
    await service.createDirectory(TEST_DIR);
  });

  describe('File Operations', () => {
    it('should upload a file', async () => {
      const filePath = path.join(TEST_DIR, TEST_FILE);
      const metadata = {
        contentType: 'application/pdf',
        patientId: '123',
        reportType: 'test',
      };

      const result = await service.uploadFile(filePath, TEST_CONTENT, metadata);

      expect(result.success).toBe(true);
      expect(result.path).toBe(filePath);
      expect(result.metadata).toEqual(metadata);
    });

    it('should download a file', async () => {
      // First upload a file
      const filePath = path.join(TEST_DIR, TEST_FILE);
      await service.uploadFile(filePath, TEST_CONTENT);

      // Then download it
      const result = await service.downloadFile(filePath);

      expect(result.success).toBe(true);
      expect(result.content).toEqual(TEST_CONTENT);
    });

    it('should delete a file', async () => {
      // First upload a file
      const filePath = path.join(TEST_DIR, TEST_FILE);
      await service.uploadFile(filePath, TEST_CONTENT);

      // Then delete it
      const result = await service.deleteFile(filePath);

      expect(result.success).toBe(true);

      // Verify file is gone
      await expect(service.downloadFile(filePath))
        .rejects
        .toThrow();
    });

    it('should list files in a directory', async () => {
      // Upload multiple files
      const files = ['report1.pdf', 'report2.pdf', 'report3.pdf'];
      
      for (const file of files) {
        const filePath = path.join(TEST_DIR, file);
        await service.uploadFile(filePath, TEST_CONTENT);
      }

      // List files
      const result = await service.listFiles(TEST_DIR);

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(files.length);
      expect(result.files.map(f => f.name).sort()).toEqual(files.sort());
    });
  });

  describe('Metadata Operations', () => {
    it('should update file metadata', async () => {
      // First upload a file with metadata
      const filePath = path.join(TEST_DIR, TEST_FILE);
      const initialMetadata = {
        contentType: 'application/pdf',
        patientId: '123',
      };

      await service.uploadFile(filePath, TEST_CONTENT, initialMetadata);

      // Update metadata
      const newMetadata = {
        ...initialMetadata,
        reportType: 'updated',
      };

      const result = await service.updateMetadata(filePath, newMetadata);

      expect(result.success).toBe(true);
      expect(result.metadata).toEqual(newMetadata);
    });

    it('should get file metadata', async () => {
      // First upload a file with metadata
      const filePath = path.join(TEST_DIR, TEST_FILE);
      const metadata = {
        contentType: 'application/pdf',
        patientId: '123',
        reportType: 'test',
      };

      await service.uploadFile(filePath, TEST_CONTENT, metadata);

      // Get metadata
      const result = await service.getMetadata(filePath);

      expect(result.success).toBe(true);
      expect(result.metadata).toEqual(metadata);
    });
  });

  describe('Directory Operations', () => {
    it('should create a directory', async () => {
      const dirPath = path.join(TEST_DIR, 'subdir');
      const result = await service.createDirectory(dirPath);

      expect(result.success).toBe(true);

      // Verify directory exists
      const listResult = await service.listFiles(dirPath);
      expect(listResult.success).toBe(true);
    });

    it('should delete a directory recursively', async () => {
      // Create directory with files
      const dirPath = path.join(TEST_DIR, 'delete-test');
      await service.createDirectory(dirPath);

      const filePath = path.join(dirPath, TEST_FILE);
      await service.uploadFile(filePath, TEST_CONTENT);

      // Delete directory
      const result = await service.deleteDirectory(dirPath);

      expect(result.success).toBe(true);

      // Verify directory is gone
      await expect(service.listFiles(dirPath))
        .rejects
        .toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing files', async () => {
      await expect(service.downloadFile('non-existent.pdf'))
        .rejects
        .toThrow();
    });

    it('should handle invalid paths', async () => {
      await expect(service.uploadFile('../invalid/path.pdf', TEST_CONTENT))
        .rejects
        .toThrow();
    });

    it('should handle storage provider errors', async () => {
      // Force provider error by disconnecting
      await storageProvider.disconnect();

      await expect(service.uploadFile(TEST_FILE, TEST_CONTENT))
        .rejects
        .toThrow();

      // Reconnect for other tests
      await storageProvider.connect();
    });
  });

  describe('Performance', () => {
    it('should handle large files efficiently', async () => {
      const largeContent = Buffer.alloc(5 * 1024 * 1024); // 5MB
      const filePath = path.join(TEST_DIR, 'large-file.pdf');

      const startTime = Date.now();
      
      const result = await service.uploadFile(filePath, largeContent);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent operations', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => ({
        path: path.join(TEST_DIR, `concurrent-${i}.pdf`),
        content: Buffer.from(`Content ${i}`),
      }));

      const startTime = Date.now();
      
      const results = await Promise.all(
        operations.map(op => service.uploadFile(op.path, op.content))
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(operations.length);
      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeLessThan(5000);
    });
  });
}); 