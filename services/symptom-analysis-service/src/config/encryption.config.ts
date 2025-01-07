import { registerAs } from '@nestjs/config';

export interface EncryptionConfig {
  key: string;
  algorithm: string;
  keyIterations: number;
  saltLength: number;
  ivLength: number;
  tagLength: number;
}

export default registerAs('encryption', (): EncryptionConfig => ({
  key: process.env.ENCRYPTION_KEY || '',
  algorithm: 'aes-256-gcm',
  keyIterations: 100000,
  saltLength: 16,
  ivLength: 12,
  tagLength: 16
})); 