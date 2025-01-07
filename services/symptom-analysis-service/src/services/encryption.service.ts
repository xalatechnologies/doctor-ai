import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;
  private readonly ivLength = 12;
  private readonly saltLength = 16;
  private readonly tagLength = 16;

  constructor(private configService: ConfigService) {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    // Derive a 32-byte key using PBKDF2
    const salt = crypto.randomBytes(this.saltLength);
    this.key = crypto.pbkdf2Sync(encryptionKey, salt, 100000, 32, 'sha256');
  }

  encrypt(data: string): string {
    try {
      // Generate IV
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      
      // Encrypt data
      let encryptedData = cipher.update(data, 'utf8', 'hex');
      encryptedData += cipher.final('hex');
      
      // Get auth tag
      const authTag = cipher.getAuthTag();
      
      // Combine IV, auth tag, and encrypted data
      const combined = Buffer.concat([iv, authTag, Buffer.from(encryptedData, 'hex')]);
      
      return combined.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  decrypt(encryptedData: string): string {
    try {
      // Convert base64 to buffer
      const data = Buffer.from(encryptedData, 'base64');
      
      // Extract IV, auth tag, and encrypted data
      const iv = data.subarray(0, this.ivLength);
      const authTag = data.subarray(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = data.subarray(this.ivLength + this.tagLength);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt data
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  encryptObject<T extends object>(obj: T): T {
    const encryptedObj = { ...obj };
    for (const [key, value] of Object.entries(obj)) {
      if (this.shouldEncrypt(key) && typeof value === 'string') {
        (encryptedObj as any)[key] = this.encrypt(value);
      } else if (typeof value === 'object' && value !== null) {
        (encryptedObj as any)[key] = this.encryptObject(value);
      }
    }
    return encryptedObj;
  }

  decryptObject<T extends object>(obj: T): T {
    const decryptedObj = { ...obj };
    for (const [key, value] of Object.entries(obj)) {
      if (this.shouldEncrypt(key) && typeof value === 'string') {
        (decryptedObj as any)[key] = this.decrypt(value);
      } else if (typeof value === 'object' && value !== null) {
        (decryptedObj as any)[key] = this.decryptObject(value);
      }
    }
    return decryptedObj;
  }

  private shouldEncrypt(key: string): boolean {
    const sensitiveFields = [
      'name',
      'details',
      'symptoms',
      'diagnosis',
      'medicalHistory',
      'medications',
      'allergies',
      'notes',
      'findings',
      'interpretation'
    ];
    return sensitiveFields.includes(key);
  }
} 