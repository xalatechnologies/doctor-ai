import { Test, TestingModule } from '@nestjs/testing';
import {
  PDFReportService,
  PDFReportContent,
  PDFReportSectionStyle,
} from './pdf-report.service';
import PDFDocument from 'pdfkit';

jest.mock('pdfkit', () => {
  return function () {
    return {
      on: jest.fn().mockReturnThis(),
      fontSize: jest.fn().mockReturnThis(),
      font: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveDown: jest.fn().mockReturnThis(),
      image: jest.fn().mockReturnThis(),
      fillColor: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };
  };
});

describe('PDFReportService', () => {
  let service: PDFReportService;

  const sampleContent: PDFReportContent = {
    title: 'Test Report',
    sections: [
      {
        heading: 'Test Section',
        content: 'Test Content',
        style: {
          fontSize: 12,
          fontColor: 'black',
        },
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PDFReportService],
    }).compile();

    service = module.get<PDFReportService>(PDFReportService);
  });

  it('should apply custom options', async () => {
    // Test implementation
  });
});
