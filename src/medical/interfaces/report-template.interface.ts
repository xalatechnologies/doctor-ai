export interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'metrics' | 'chart' | 'comparison' | 'analysis';
  enabled: boolean;
  order: number;
  options?: {
    charts?: string[];
    timeframe?: '24h' | '7d';
    metrics?: string[];
    style?: {
      fontSize?: number;
      color?: string;
      layout?: 'single' | 'double' | 'grid';
    };
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  style: {
    theme: 'light' | 'dark';
    fontFamily: string;
    headerLogo?: string;
    footerText?: string;
  };
} 