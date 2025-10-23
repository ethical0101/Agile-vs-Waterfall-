export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  role: 'user' | 'admin';
  teamId?: string;
  createdAt: Date;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  createdAt: Date;
}

export interface Project {
  id: string;
  teamId: string;
  ownerId: string;
  name: string;
  methodology: 'Agile' | 'Waterfall' | 'Hybrid';
  industry: string;
  size: 'Small' | 'Medium' | 'Large';
  startDate: Date;
  endDate?: Date;
  teamSize: number;
  createdAt: Date;
}

export interface ProjectCost {
  id: string;
  projectId: string;
  date: Date;
  plannedCost: number;
  actualCost: number;
  reworkCost: number;
  overhead: number;
  defectCost: number;
  toolingCost: number;
  notes?: string;
}

export interface Analysis {
  id: string;
  teamId: string;
  ownerId: string;
  name: string;
  filters: AnalysisFilters;
  metrics: string[];
  statisticalTest: 'ttest' | 'mannwhitney';
  createdAt: Date;
  resultsSummary?: AnalysisResults;
}

export interface AnalysisFilters {
  methodology?: string[];
  industry?: string[];
  size?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  teamSizeRange?: {
    min: number;
    max: number;
  };
}

export interface AnalysisResults {
  summary: {
    totalProjects: number;
    agileProjects: number;
    waterfallProjects: number;
    hybridProjects: number;
  };
  metrics: {
    [key: string]: {
      agile: StatisticalSummary;
      waterfall: StatisticalSummary;
      comparison: ComparisonResult;
    };
  };
  recommendations: string[];
}

export interface StatisticalSummary {
  mean: number;
  median: number;
  standardDeviation: number;
  count: number;
  min: number;
  max: number;
}

export interface ComparisonResult {
  meanDifference: number;
  pValue: number;
  effectSize: number;
  confidenceInterval: [number, number];
  interpretation: string;
}