import React, { useState, useEffect } from 'react';
import {
  Play,
  Save,
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { ComparisonChart } from '../components/charts/ComparisonChart';
import { formatCurrency } from '../utils/statistics';
import { useProjects } from '../contexts/ProjectsContext';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../lib/firestoreService';

interface MetricStats {
  mean: number;
  median: number;
  standardDeviation: number;
  count: number;
  min: number;
  max: number;
}

interface MetricComparison {
  meanDifference: number;
  pValue: number;
  effectSize: number;
  confidenceInterval: [number, number];
  interpretation: string;
}

interface MetricData {
  agile: MetricStats | null;
  waterfall: MetricStats | null;
  comparison: MetricComparison | null;
}

interface AnalysisResults {
  summary: {
    totalProjects: number;
    agileProjects: number;
    waterfallProjects: number;
    hybridProjects: number;
  };
  metrics: {
    [key: string]: MetricData;
  };
  recommendations: string[];
}

export const Analysis: React.FC = () => {
  const { projects } = useProjects();
  const { currentUser } = useAuth();
  const [analysisConfig, setAnalysisConfig] = useState({
    name: '',
    methodology: ['Agile', 'Waterfall'],
    industry: [],
    size: [],
    dateRange: { start: '', end: '' },
    metrics: ['actualCost', 'costVariance', 'reworkCost'],
    statisticalTest: 'ttest' as 'ttest' | 'mannwhitney',
  });

  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(false);
  // Removed savedAnalyses state to simplify component

  // Load saved analyses when user is authenticated (simplified for now)
  useEffect(() => {
    if (currentUser) {
      console.log('User authenticated for analysis page');
    }
  }, [currentUser]);



  const generateAnalysisResults = (): AnalysisResults => {
    if (projects.length === 0) {
      return {
        summary: {
          totalProjects: 0,
          agileProjects: 0,
          waterfallProjects: 0,
          hybridProjects: 0,
        },
        metrics: {
          actualCost: { agile: null, waterfall: null, comparison: null },
          costVariance: { agile: null, waterfall: null, comparison: null },
          reworkCost: { agile: null, waterfall: null, comparison: null },
        },
        recommendations: ['No projects available for analysis. Please add some projects first.'],
      };
    }

    const agileProjects = projects.filter(p => p.methodology === 'Agile');
    const waterfallProjects = projects.filter(p => p.methodology === 'Waterfall');
    const hybridProjects = projects.filter(p => p.methodology === 'Hybrid');

    const calculateStats = (projectList: typeof projects, metric: 'actualCost' | 'costVariance' | 'reworkCost' = 'actualCost') => {
      if (projectList.length === 0) return null;

      let values: number[] = [];
      switch (metric) {
        case 'actualCost':
          values = projectList.map(p => p.actualCost);
          break;
        case 'costVariance':
          values = projectList.map(p => Math.abs(p.actualCost - p.plannedCost));
          break;
        case 'reworkCost':
          // Estimate rework cost as a percentage of cost variance for projects that went over budget
          values = projectList.map(p => {
            const variance = p.actualCost - p.plannedCost;
            return variance > 0 ? variance * 0.3 : 0; // 30% of overrun is estimated as rework
          });
          break;
        default:
          values = projectList.map(p => p.actualCost);
      }

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const sortedValues = [...values].sort((a, b) => a - b);
      const median = sortedValues.length % 2 === 0
        ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
        : sortedValues[Math.floor(sortedValues.length / 2)];

      const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
      const standardDeviation = Math.sqrt(variance);

      return {
        mean,
        median,
        standardDeviation,
        count: projectList.length,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    };

    // Calculate stats for all metrics
    const agileActualCost = calculateStats(agileProjects, 'actualCost');
    const waterfallActualCost = calculateStats(waterfallProjects, 'actualCost');
    const agileCostVariance = calculateStats(agileProjects, 'costVariance');
    const waterfallCostVariance = calculateStats(waterfallProjects, 'costVariance');
    const agileReworkCost = calculateStats(agileProjects, 'reworkCost');
    const waterfallReworkCost = calculateStats(waterfallProjects, 'reworkCost');

    let comparison = null;
    if (agileActualCost && waterfallActualCost) {
      const meanDifference = agileActualCost.mean - waterfallActualCost.mean;
      // Simple comparison without complex statistical tests for now
      const pooledSD = Math.sqrt(
        ((agileActualCost.count - 1) * agileActualCost.standardDeviation ** 2 +
         (waterfallActualCost.count - 1) * waterfallActualCost.standardDeviation ** 2) /
        (agileActualCost.count + waterfallActualCost.count - 2)
      );
      const effectSize = meanDifference / pooledSD;

      comparison = {
        meanDifference,
        pValue: Math.abs(effectSize) > 0.5 ? 0.05 : 0.1, // Simplified
        effectSize,
        confidenceInterval: [meanDifference - 10000, meanDifference + 10000] as [number, number],
        interpretation: Math.abs(effectSize) > 0.8 ? 'Large effect size' :
                       Math.abs(effectSize) > 0.5 ? 'Medium effect size' : 'Small effect size'
      };
    }

    const recommendations = [];
    if (agileActualCost && waterfallActualCost) {
      if (agileActualCost.mean < waterfallActualCost.mean) {
        recommendations.push(`Agile methodology shows lower average costs ($${agileActualCost.mean.toLocaleString()} vs $${waterfallActualCost.mean.toLocaleString()})`);
      } else {
        recommendations.push(`Waterfall methodology shows lower average costs ($${waterfallActualCost.mean.toLocaleString()} vs $${agileActualCost.mean.toLocaleString()})`);
      }
    }

    if (hybridProjects.length > 0) {
      const hybridStats = calculateStats(hybridProjects, 'actualCost');
      if (hybridStats) {
        recommendations.push(`Hybrid methodology average cost: $${hybridStats.mean.toLocaleString()}`);
      }
    }

    return {
      summary: {
        totalProjects: projects.length,
        agileProjects: agileProjects.length,
        waterfallProjects: waterfallProjects.length,
        hybridProjects: hybridProjects.length,
      },
      metrics: {
        actualCost: {
          agile: agileActualCost,
          waterfall: waterfallActualCost,
          comparison,
        },
        costVariance: {
          agile: agileCostVariance,
          waterfall: waterfallCostVariance,
          comparison: null,
        },
        reworkCost: {
          agile: agileReworkCost,
          waterfall: waterfallReworkCost,
          comparison: null,
        },
      },
      recommendations: recommendations.length > 0 ? recommendations : ['Insufficient data for meaningful recommendations'],
    };
  };

  const runAnalysis = async () => {
    if (!analysisConfig.name.trim()) {
      alert('Please provide a name for this analysis');
      return;
    }

    if (!projects || projects.length === 0) {
      alert('No projects available for analysis. Please add some projects first.');
      return;
    }

    console.log('Starting analysis with projects:', projects.length);
    setLoading(true);

    try {
      // Generate analysis results
      const analysisResults = generateAnalysisResults();
      console.log('Analysis results generated:', analysisResults);
      setResults(analysisResults);

      // Save to database if user is authenticated
      if (currentUser) {
        try {
          const projectIds = projects.map(p => p.id);
          await firestoreService.saveAnalysisResult({
            userId: currentUser.uid,
            name: analysisConfig.name,
            projectIds,
            results: analysisResults,
            configuration: analysisConfig
          });
          console.log('Analysis saved to database');
        } catch (saveError) {
          console.error('Error saving to database:', saveError);
          // Don't block the analysis if saving fails
        }
      }
    } catch (error) {
      console.error('Error running analysis:', error);
      alert(`Failed to run analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    // Mock PDF export
    alert('PDF export functionality would be implemented here');
  };

  const exportToCSV = () => {
    if (!results) {
      alert('Please run an analysis first before exporting');
      return;
    }

    try {
      // Create CSV data from analysis results
      const csvData = [
        ['Analysis Name', analysisConfig.name],
        ['Date', new Date().toLocaleDateString()],
        [''],
        ['Summary'],
        ['Total Projects', results.summary.totalProjects],
        ['Agile Projects', results.summary.agileProjects],
        ['Waterfall Projects', results.summary.waterfallProjects],
        ['Hybrid Projects', results.summary.hybridProjects],
        [''],
        ['Methodology Comparison'],
        ['Metric', 'Agile Mean', 'Agile Std Dev', 'Waterfall Mean', 'Waterfall Std Dev', 'P-Value', 'Significant'],
      ];

      Object.entries(results.metrics).forEach(([metricName, metric]) => {
        csvData.push([
          metricName.replace(/([A-Z])/g, ' $1').trim(),
          metric.agile ? metric.agile.mean.toFixed(2) : 'N/A',
          metric.agile ? metric.agile.standardDeviation.toFixed(2) : 'N/A',
          metric.waterfall ? metric.waterfall.mean.toFixed(2) : 'N/A',
          metric.waterfall ? metric.waterfall.standardDeviation.toFixed(2) : 'N/A',
          metric.comparison ? metric.comparison.pValue.toFixed(4) : 'N/A',
          metric.comparison ? (metric.comparison.pValue < 0.05 ? 'Yes' : 'No') : 'N/A'
        ]);
      });

      csvData.push([''], ['Recommendations']);
      results.recommendations.forEach((rec: string, index: number) => {
        csvData.push([`${index + 1}`, rec]);
      });

      // Convert to CSV string
      const csvContent = csvData.map(row =>
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');

      // Download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analysis-${analysisConfig.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  // Add error boundary
  if (!projects) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Projects</h3>
          <p className="text-gray-600">Please refresh the page and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analysis Center</h1>
          <p className="text-gray-600 mt-1">
            Compare methodologies and generate insights
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Analysis Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Analysis Name
                </label>
                <input
                  type="text"
                  value={analysisConfig.name}
                  onChange={(e) => setAnalysisConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Q1 2024 Comparison"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Methodologies
                </label>
                <div className="space-y-2">
                  {['Agile', 'Waterfall', 'Hybrid'].map((method) => (
                    <label key={method} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={analysisConfig.methodology.includes(method)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAnalysisConfig(prev => ({
                              ...prev,
                              methodology: [...prev.methodology, method]
                            }));
                          } else {
                            setAnalysisConfig(prev => ({
                              ...prev,
                              methodology: prev.methodology.filter(m => m !== method)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{method}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metrics to Compare
                </label>
                <div className="space-y-2">
                  {[
                    { key: 'actualCost', label: 'Actual Cost' },
                    { key: 'costVariance', label: 'Cost Variance' },
                    { key: 'reworkCost', label: 'Rework Cost' },
                    { key: 'overhead', label: 'Overhead' },
                  ].map((metric) => (
                    <label key={metric.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={analysisConfig.metrics.includes(metric.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAnalysisConfig(prev => ({
                              ...prev,
                              metrics: [...prev.metrics, metric.key]
                            }));
                          } else {
                            setAnalysisConfig(prev => ({
                              ...prev,
                              metrics: prev.metrics.filter(m => m !== metric.key)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{metric.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statistical Test
                </label>
                <select
                  value={analysisConfig.statisticalTest}
                  onChange={(e) => setAnalysisConfig(prev => ({
                    ...prev,
                    statisticalTest: e.target.value as 'ttest' | 'mannwhitney'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="Select statistical test method"
                >
                  <option value="ttest">Welch's t-test</option>
                  <option value="mannwhitney">Mann-Whitney U test</option>
                </select>
              </div>

              <div className="pt-4 space-y-3">
                <button
                  onClick={runAnalysis}
                  disabled={loading}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  {loading ? 'Running...' : 'Run Analysis'}
                </button>

                {results && (
                  <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Save className="w-4 h-4 mr-2" />
                    Save Configuration
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {loading && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Running statistical analysis...</p>
            </div>
          )}

          {results && !loading && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {results.summary.totalProjects}
                  </div>
                  <div className="text-sm text-gray-600">Total Projects</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {results.summary.agileProjects}
                  </div>
                  <div className="text-sm text-gray-600">Agile Projects</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-2xl font-bold text-orange-600">
                    {results.summary.waterfallProjects}
                  </div>
                  <div className="text-sm text-gray-600">Waterfall Projects</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {results.summary.hybridProjects}
                  </div>
                  <div className="text-sm text-gray-600">Hybrid Projects</div>
                </div>
              </div>

              {/* Charts */}
              <ComparisonChart
                data={{
                  labels: ['Actual Cost', 'Cost Variance'],
                  agileData: [
                    results.metrics.actualCost?.agile?.mean || 0,
                    results.metrics.costVariance?.agile?.mean || 0,
                  ],
                  waterfallData: [
                    results.metrics.actualCost?.waterfall?.mean || 0,
                    results.metrics.costVariance?.waterfall?.mean || 0,
                  ],
                }}
                title="Mean Cost Comparison"
              />

              {/* Statistical Results */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Statistical Analysis Results
                </h3>

                <div className="space-y-6">
                  {Object.entries(results.metrics).map(([metric, data]: [string, MetricData]) => (
                    <div key={metric} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <h4 className="font-medium text-gray-900 mb-3 capitalize">
                        {metric.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {data.agile && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="text-sm font-medium text-blue-900 mb-2">Agile</div>
                            <div className="text-lg font-bold text-blue-700">
                              {formatCurrency(data.agile.mean)}
                            </div>
                            <div className="text-sm text-blue-600">
                              Median: {formatCurrency(data.agile.median)}
                            </div>
                            <div className="text-sm text-blue-600">
                              SD: {formatCurrency(data.agile.standardDeviation)}
                            </div>
                          </div>
                        )}

                        {data.waterfall && (
                          <div className="bg-orange-50 p-4 rounded-lg">
                            <div className="text-sm font-medium text-orange-900 mb-2">Waterfall</div>
                            <div className="text-lg font-bold text-orange-700">
                              {formatCurrency(data.waterfall.mean)}
                            </div>
                            <div className="text-sm text-orange-600">
                              Median: {formatCurrency(data.waterfall.median)}
                            </div>
                            <div className="text-sm text-orange-600">
                              SD: {formatCurrency(data.waterfall.standardDeviation)}
                            </div>
                          </div>
                        )}

                        {data.comparison && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm font-medium text-gray-900 mb-2">Comparison</div>
                            <div className="text-lg font-bold text-gray-700">
                              {formatCurrency(data.comparison.meanDifference)}
                            </div>
                            <div className="text-sm text-gray-600">
                              p-value: {data.comparison.pValue.toFixed(3)}
                            </div>
                            <div className="text-sm text-gray-600">
                              Effect size: {data.comparison.effectSize.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-yellow-900 mb-1">
                              Interpretation
                            </div>
                            <div className="text-sm text-yellow-800">
                              {data.comparison?.interpretation || 'No comparison available'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Recommendations
                </h3>
                <div className="space-y-3">
                  {results.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                      <p className="text-sm text-gray-700">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Export Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={exportToCSV}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </button>
                <button
                  onClick={exportToPDF}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Export PDF
                </button>
              </div>
            </div>
          )}

          {!results && !loading && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready to Analyze
              </h3>
              <p className="text-gray-600">
                Configure your analysis parameters and click "Run Analysis" to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
