import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CulturalContextService } from '../cultural-context/cultural-context.service';
import PDFDocument from 'pdfkit';

export interface PDFOptions {
  format?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
  };
  encryption?: {
    userPassword?: string;
    ownerPassword?: string;
    permissions?: {
      printing?: boolean;
      modifying?: boolean;
      copying?: boolean;
      annotating?: boolean;
    };
  };
}

export interface ReportContent {
  title: string;
  sections: {
    heading: string;
    content: string | string[];
    style?: {
      fontSize?: number;
      font?: string;
      color?: string;
      alignment?: 'left' | 'center' | 'right';
    };
  }[];
  footer?: {
    text: string;
    pageNumbers?: boolean;
  };
  header?: {
    text: string;
    logo?: {
      path: string;
      width: number;
      height: number;
    };
  };
}

@Injectable()
export class PDFReportService {
  private readonly logger = new Logger(PDFReportService.name);
  private readonly defaultOptions: PDFOptions = {
    format: 'A4',
    orientation: 'portrait',
    margins: {
      top: 72,
      bottom: 72,
      left: 72,
      right: 72,
    },
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly culturalContextService: CulturalContextService,
  ) {}

  async generateReport(
    content: ReportContent,
    options: PDFOptions = {},
    culturalContext?: string,
  ): Promise<Buffer> {
    try {
      const mergedOptions = { ...this.defaultOptions, ...options };
      const doc = new PDFDocument({
        size: mergedOptions.format,
        layout: mergedOptions.orientation,
        margins: mergedOptions.margins,
        info: mergedOptions.metadata
          ? {
              Title: mergedOptions.metadata.title,
              Author: mergedOptions.metadata.author,
              Subject: mergedOptions.metadata.subject,
              Keywords: mergedOptions.metadata.keywords?.join(','),
            }
          : undefined,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));

      // Apply cultural context if provided
      if (culturalContext) {
        content = await this.adaptContentToCulturalContext(
          content,
          culturalContext,
        );
      }

      // Generate the PDF content
      await this.generatePDFContent(doc, content);

      // Finalize the PDF
      doc.end();

      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const result = Buffer.concat(chunks);
          resolve(result);
        });
        doc.on('error', reject);
      });
    } catch (error) {
      this.logger.error('Failed to generate PDF report:', error);
      throw error;
    }
  }

  private async adaptContentToCulturalContext(
    content: ReportContent,
    culturalContext: string,
  ): Promise<ReportContent> {
    try {
      const context =
        await this.culturalContextService.getContextForUser(culturalContext);

      // Adapt title
      content.title = await this.culturalContextService.adaptContent(
        content.title,
        context,
      );

      // Adapt sections
      content.sections = await Promise.all(
        content.sections.map(async (section) => ({
          ...section,
          heading: await this.culturalContextService.adaptContent(
            section.heading,
            context,
          ),
          content:
            typeof section.content === 'string'
              ? await this.culturalContextService.adaptContent(
                  section.content,
                  context,
                )
              : await Promise.all(
                  section.content.map((text) =>
                    this.culturalContextService.adaptContent(text, context),
                  ),
                ),
        })),
      );

      // Adapt footer
      if (content.footer) {
        content.footer.text = await this.culturalContextService.adaptContent(
          content.footer.text,
          context,
        );
      }

      // Adapt header
      if (content.header) {
        content.header.text = await this.culturalContextService.adaptContent(
          content.header.text,
          context,
        );
      }

      return content;
    } catch (error) {
      this.logger.error('Failed to adapt content to cultural context:', error);
      throw error;
    }
  }

  private async generatePDFContent(
    doc: PDFKit.PDFDocument,
    content: ReportContent,
  ): Promise<void> {
    let pageNumber = 1;

    // Add title
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text(content.title, { align: 'center' })
      .moveDown(2);

    // Add header if provided
    if (content.header) {
      if (content.header.logo) {
        doc.image(content.header.logo.path, {
          width: content.header.logo.width,
          height: content.header.logo.height,
        });
      }
      doc.fontSize(12).font('Helvetica').text(content.header.text).moveDown();
    }

    // Add sections
    for (const section of content.sections) {
      doc
        .fontSize(section.style?.fontSize || 16)
        .font(section.style?.font || 'Helvetica-Bold')
        .text(section.heading, { align: section.style?.alignment || 'left' })
        .moveDown();

      doc
        .fontSize(section.style?.fontSize || 12)
        .font(section.style?.font || 'Helvetica')
        .fillColor(section.style?.color || 'black');

      if (Array.isArray(section.content)) {
        section.content.forEach((text) => {
          doc
            .text(text, { align: section.style?.alignment || 'left' })
            .moveDown();
        });
      } else {
        doc
          .text(section.content, { align: section.style?.alignment || 'left' })
          .moveDown();
      }

      doc.moveDown();
    }

    // Add footer if provided
    if (content.footer) {
      const footerTop = doc.page.height - doc.page.margins.bottom;
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(content.footer.text, doc.page.margins.left, footerTop, {
          align: 'center',
          width:
            doc.page.width - doc.page.margins.left - doc.page.margins.right,
        });

      if (content.footer.pageNumbers) {
        doc.text(`Page ${pageNumber}`, { align: 'right' });
      }
    }

    // Add page number listener
    doc.on('pageAdded', () => {
      pageNumber++;
      if (content.footer?.pageNumbers) {
        const footerTop = doc.page.height - doc.page.margins.bottom;
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Page ${pageNumber}`, doc.page.margins.left, footerTop, {
            align: 'right',
            width:
              doc.page.width - doc.page.margins.left - doc.page.margins.right,
          });
      }
    });
  }
}
