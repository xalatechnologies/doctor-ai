import { Injectable } from '@nestjs/common';
import { MetricsService } from '../metrics/metrics.service';
import PDFDocument from 'pdfkit';

export interface PDFReportStyle {
  fontSize?: number;
  fontColor?: string;
}

export interface PDFReportSection {
  heading: string;
  content: string;
  style?: PDFReportStyle;
}

export interface PDFReportContent {
  title: string;
  sections: PDFReportSection[];
}

@Injectable()
export class PDFReportService {
  constructor(private readonly metricsService: MetricsService) {}

  async generateReport(content: PDFReportContent): Promise<Buffer> {
    try {
      if (!content) {
        this.metricsService.logError('pdf', 'invalid_content');
        throw new Error('Invalid report content');
      }

      if (!content.title || !Array.isArray(content.sections)) {
        this.metricsService.logError('pdf', 'invalid_content_structure');
        throw new Error('Invalid report content structure');
      }

      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => {});

      // Add title
      doc.fontSize(16).text(content.title, { align: 'center' });
      doc.moveDown();

      // Add sections
      for (const section of content.sections) {
        if (!section || !section.heading || !section.content) {
          this.metricsService.logError('pdf', 'invalid_section');
          throw new Error('Invalid section structure');
        }

        doc.fontSize(14).text(section.heading);
        doc.moveDown(0.5);

        const wrappedText = this.wrapText(section.content, 80);
        doc.fontSize(section.style?.fontSize || 12)
          .fillColor(section.style?.fontColor || 'black');

        for (const line of wrappedText) {
          doc.text(line);
        }
        doc.moveDown();
      }

      doc.end();

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: Error) => {
          this.metricsService.logError('pdf', 'generation_error');
          reject(new Error(`Failed to generate PDF: ${err.message}`));
        });
      });
    } catch (error) {
      if (error instanceof Error) {
        // Re-throw validation errors
        if (error.message.includes('Invalid')) {
          throw error;
        }
      }
      // Log and wrap other errors
      this.metricsService.logError('pdf', 'generation_error');
      throw new Error('Failed to generate PDF report');
    }
  }

  private wrapText(text: string | null | undefined, maxWidth: number): string[] {
    if (!text) {
      return [];
    }
    // Simple word wrapping implementation
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = currentLine.length + word.length + 1;
      if (width <= maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }
}
