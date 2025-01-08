import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  VisualizationService,
  ChartType,
  VisualizationOptions,
} from './visualization.service';
import { Canvas, createCanvas } from 'canvas';

jest.mock('canvas', () => ({
  createCanvas: jest.fn(() => ({
    getContext: jest.fn(() => ({
      fillStyle: '',
      fillRect: jest.fn(),
      strokeStyle: '',
      strokeRect: jest.fn(),
      font: '',
      textAlign: '',
      textBaseline: '',
      fillText: jest.fn(),
      drawImage: jest.fn(),
    })),
    width: 800,
    height: 600,
    toBuffer: jest.fn().mockReturnValue(Buffer.from('test')),
  })),
  Canvas: jest.fn(),
}));

describe('VisualizationService', () => {
  let service: VisualizationService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const defaultOptions: VisualizationOptions = {
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    responsive: true,
    maintainAspectRatio: true,
    title: {
      display: true,
      text: 'Test Chart',
    },
    legend: {
      display: true,
      position: 'top',
    },
  };

  const sampleChartData = {
    labels: ['January', 'February', 'March'],
    datasets: [
      {
        label: 'Sample Data',
        data: [65, 59, 80],
      },
    ],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisualizationService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<VisualizationService>(VisualizationService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateChart', () => {
    it('should generate a single chart', async () => {
      const type: ChartType = 'line';
      const buffer = await service.generateChart(
        type,
        sampleChartData,
        defaultOptions,
      );

      expect(buffer).toBeDefined();
      expect(createCanvas).toHaveBeenCalledWith(
        defaultOptions.width,
        defaultOptions.height,
      );
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('Canvas creation failed');
      (createCanvas as jest.Mock).mockImplementationOnce(() => {
        throw mockError;
      });

      await expect(
        service.generateChart('line', sampleChartData, defaultOptions),
      ).rejects.toThrow('Canvas creation failed');
    });
  });

  describe('generateMultipleCharts', () => {
    it('should generate multiple charts', async () => {
      const charts = [
        {
          type: 'line' as ChartType,
          data: sampleChartData,
          options: defaultOptions,
        },
        {
          type: 'bar' as ChartType,
          data: sampleChartData,
          options: defaultOptions,
        },
      ];

      const buffers = await service.generateMultipleCharts(charts);

      expect(buffers).toHaveLength(2);
      expect(createCanvas).toHaveBeenCalledTimes(2);
      buffers.forEach((buffer) => {
        expect(buffer).toBeInstanceOf(Buffer);
      });
    });

    it('should handle errors in multiple chart generation', async () => {
      const mockError = new Error('Chart generation failed');
      (createCanvas as jest.Mock).mockImplementationOnce(() => {
        throw mockError;
      });

      const charts = [
        {
          type: 'line' as ChartType,
          data: sampleChartData,
          options: defaultOptions,
        },
      ];

      await expect(service.generateMultipleCharts(charts)).rejects.toThrow(
        'Chart generation failed',
      );
    });
  });

  describe('generateDashboard', () => {
    it('should generate a dashboard with multiple charts', async () => {
      const layout = {
        rows: 2,
        cols: 2,
        charts: [
          {
            type: 'line' as ChartType,
            data: sampleChartData,
            options: defaultOptions,
            position: { row: 0, col: 0 },
          },
          {
            type: 'bar' as ChartType,
            data: sampleChartData,
            options: defaultOptions,
            position: { row: 0, col: 1 },
          },
        ],
      };

      const dashboardOptions = {
        width: 1200,
        height: 800,
        padding: 20,
        backgroundColor: '#ffffff',
      };

      const buffer = await service.generateDashboard(layout, dashboardOptions);

      expect(buffer).toBeDefined();
      expect(createCanvas).toHaveBeenCalledWith(
        dashboardOptions.width,
        dashboardOptions.height,
      );
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle charts with different spans', async () => {
      const layout = {
        rows: 2,
        cols: 2,
        charts: [
          {
            type: 'line' as ChartType,
            data: sampleChartData,
            options: defaultOptions,
            position: { row: 0, col: 0, rowSpan: 2, colSpan: 1 },
          },
        ],
      };

      const dashboardOptions = {
        width: 1200,
        height: 800,
      };

      const buffer = await service.generateDashboard(layout, dashboardOptions);
      expect(buffer).toBeDefined();
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });
});
