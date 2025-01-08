import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CulturalContextService } from '../cultural-context/cultural-context.service';
import { MetricsService } from '../metrics/metrics.service';
import { PDFDocument, rgb, Color } from 'pdf-lib';

export interface PDFReportContent {
  title: string;
  sections: PDFReportSection[];
  footer?: {
    text: string;
    includePageNumbers?: boolean;
  };
}

export interface PDFReportSection {
  heading: string;
  content: string | string[];
  style?: PDFReportSectionStyle;
}

export interface PDFReportSectionStyle {
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  padding?: number;
  margin?: number;
  borderWidth?: number;
  borderColor?: string;
}

@Injectable()
export class PDFReportService {
  private readonly defaultFontSize = 12;
  private readonly defaultMargin = 50;
  private readonly defaultLineHeight = 1.5;

  constructor(
    private readonly configService: ConfigService,
    private readonly culturalContextService: CulturalContextService,
    private readonly metricsService: MetricsService,
  ) {}

  async generateReport(content: PDFReportContent, culturalContext?: string): Promise<Buffer> {
    const startTime = Date.now();
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points

      // Set default font
      const font = await pdfDoc.embedFont('Helvetica');
      page.setFont(font);

      let yOffset = page.getHeight() - this.defaultMargin;

      // Add title
      if (content.title) {
        page.drawText(content.title, {
          x: this.defaultMargin,
          y: yOffset,
          size: this.defaultFontSize * 1.5,
          color: rgb(0, 0, 0),
        });
        yOffset -= this.defaultFontSize * 2;
      }

      // Add sections
      for (const section of content.sections) {
        // Add section heading
        if (section.heading) {
          page.drawText(section.heading, {
            x: this.defaultMargin,
            y: yOffset,
            size: section.style?.fontSize || this.defaultFontSize * 1.2,
            color: this.parseColor(section.style?.fontColor),
          });
          yOffset -= this.defaultFontSize * 1.5;
        }

        // Add section content
        const contentLines = Array.isArray(section.content)
          ? section.content
          : this.wrapText(section.content, page.getWidth() - this.defaultMargin * 2);

        for (const line of contentLines) {
          if (yOffset < this.defaultMargin) {
            // Start new page if needed
            const newPage = pdfDoc.addPage([595.28, 841.89]);
            newPage.setFont(font);
            yOffset = newPage.getHeight() - this.defaultMargin;
          }

          page.drawText(line, {
            x: this.defaultMargin,
            y: yOffset,
            size: section.style?.fontSize || this.defaultFontSize,
            color: this.parseColor(section.style?.fontColor),
          });
          yOffset -= (section.style?.fontSize || this.defaultFontSize) * this.defaultLineHeight;
        }

        // Add section spacing
        yOffset -= this.defaultFontSize;
      }

      // Add footer
      if (content.footer) {
        const footerText = content.footer.includePageNumbers
          ? `${content.footer.text} - Page 1 of 1`
          : content.footer.text;

        page.drawText(footerText, {
          x: this.defaultMargin,
          y: this.defaultMargin,
          size: this.defaultFontSize * 0.8,
          color: rgb(0.5, 0.5, 0.5),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('pdf_report', 'generate', duration);

      return Buffer.from(pdfBytes);
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('pdf_report', 'generate_error', duration);
      throw error;
    }
  }

  async localizeReport(content: PDFReportContent, culturalContext: string): Promise<PDFReportContent> {
    const startTime = Date.now();
    try {
      const context = await this.culturalContextService.getUserContext(culturalContext);

      // Localize title
      content.title = await this.translateText(content.title, context.language);

      // Localize sections
      content.sections = await Promise.all(
        content.sections.map(async (section) => ({
          ...section,
          heading: await this.translateText(section.heading, context.language),
          content: Array.isArray(section.content)
            ? await Promise.all(
                section.content.map((text) => this.translateText(text, context.language)),
              )
            : await this.translateText(section.content, context.language),
        })),
      );

      // Localize footer
      if (content.footer) {
        content.footer.text = await this.translateText(content.footer.text, context.language);
      }

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('pdf_report', 'localize', duration);

      return content;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('pdf_report', 'localize_error', duration);
      throw error;
    }
  }

  private async translateText(text: string, language: string): Promise<string> {
    // Implementation would use a translation service
    // This is a placeholder implementation
    return text;
  }

  private wrapText(text: string, maxWidth: number): string[] {
    // Simple word wrapping implementation
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = this.estimateTextWidth(`${currentLine} ${word}`);

      if (width < maxWidth) {
        currentLine += ` ${word}`;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    lines.push(currentLine);
    return lines;
  }

  private estimateTextWidth(text: string): number {
    // Simple text width estimation
    // In a real implementation, this would use font metrics
    return text.length * (this.defaultFontSize * 0.6);
  }

  private parseColor(color?: string): Color {
    if (!color) return rgb(0, 0, 0);

    // Parse hex color (e.g., #FF0000)
    const hex = color.replace('#', '');
    if (hex.length === 6) {
      return rgb(
        parseInt(hex.substring(0, 2), 16) / 255,
        parseInt(hex.substring(2, 4), 16) / 255,
        parseInt(hex.substring(4, 6), 16) / 255,
      );
    }

    return rgb(0, 0, 0);
  }
}
