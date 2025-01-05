export interface ChartConfig {
  animation?: {
    duration: number;
    easing: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut';
    enabled: boolean;
  };
  interaction?: {
    mode: 'index' | 'dataset' | 'point' | 'nearest';
    intersect: boolean;
    axis: 'x' | 'y' | 'xy';
  };
  scales?: {
    x?: {
      type: 'linear' | 'logarithmic' | 'time';
      display: boolean;
      title?: {
        text: string;
        display: boolean;
      };
    };
    y?: {
      type: 'linear' | 'logarithmic';
      display: boolean;
      title?: {
        text: string;
        display: boolean;
      };
      min?: number;
      max?: number;
    };
  };
  plugins?: {
    legend?: {
      display: boolean;
      position: 'top' | 'bottom' | 'left' | 'right';
    };
    tooltip?: {
      enabled: boolean;
      mode: 'index' | 'point' | 'nearest';
      callbacks?: Record<string, (context: any) => string>;
    };
    zoom?: {
      enabled: boolean;
      mode: 'x' | 'y' | 'xy';
      sensitivity: number;
    };
  };
  responsive?: boolean;
  maintainAspectRatio?: boolean;
} 