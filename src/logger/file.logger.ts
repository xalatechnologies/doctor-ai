import { LoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export class FileLogger implements LoggerService {
  private logFile: string;

  constructor() {
    this.logFile = path.join(process.cwd(), 'app.log');
    console.log(`Initializing FileLogger. Log file: ${this.logFile}`);
    
    try {
      if (!fs.existsSync(this.logFile)) {
        fs.writeFileSync(this.logFile, '');
        console.log('Created new log file');
      }
    } catch (error) {
      console.error('Error creating log file:', error);
    }
  }

  log(message: string) {
    this.writeLog('LOG', message);
    console.log(message);
  }

  error(message: string, trace: string) {
    this.writeLog('ERROR', message, trace);
    console.error(message);
    if (trace) console.error(trace);
  }

  warn(message: string) {
    this.writeLog('WARN', message);
    console.warn(message);
  }

  debug(message: string) {
    this.writeLog('DEBUG', message);
    console.debug(message);
  }

  private writeLog(level: string, message: string, trace?: string) {
    try {
      const timestamp = new Date().toISOString();
      const log = `${timestamp} [${level}] ${message}${trace ? `\n${trace}` : ''}\n`;
      fs.appendFileSync(this.logFile, log, { encoding: 'utf8' });
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }
} 