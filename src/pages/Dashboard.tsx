import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  DollarSign,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { KPICard } from '../components/dashboard/KPICard';
import { ComparisonChart } from '../components/charts/ComparisonChart';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectsContext';
import { formatCurrency } from '../utils/statistics';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { projects } = useProjects();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Calculate real dashboard data from projects
  const dashboardData = useMemo(() => {
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const activeProjects = projects.filter(p => p.status === 'Active').length;
    const onHoldProjects = projects.filter(p => p.status === 'On Hold').length;

    // Calculate average cost variance
    const projectsWithCosts = projects.filter(p => p.plannedCost > 0);
    const avgCostVariance = projectsWithCosts.length > 0
      ? projectsWithCosts.reduce((sum, p) => {
          const variance = ((p.actualCost - p.plannedCost) / p.plannedCost) * 100;
          return sum + variance;
        }, 0) / projectsWithCosts.length
      : 0;

    // Calculate average costs by methodology
    const agileProjects = projects.filter(p => p.methodology === 'Agile');
    const waterfallProjects = projects.filter(p => p.methodology === 'Waterfall');
    const hybridProjects = projects.filter(p => p.methodology === 'Hybrid');

    const avgAgileActual = agileProjects.length > 0
      ? agileProjects.reduce((sum, p) => sum + p.actualCost, 0) / agileProjects.length
      : 0;
    const avgWaterfallActual = waterfallProjects.length > 0
      ? waterfallProjects.reduce((sum, p) => sum + p.actualCost, 0) / waterfallProjects.length
      : 0;
    const avgHybridActual = hybridProjects.length > 0
      ? hybridProjects.reduce((sum, p) => sum + p.actualCost, 0) / hybridProjects.length
      : 0;

    const avgAgilePlanned = agileProjects.length > 0
      ? agileProjects.reduce((sum, p) => sum + p.plannedCost, 0) / agileProjects.length
      : 0;
    const avgWaterfallPlanned = waterfallProjects.length > 0
      ? waterfallProjects.reduce((sum, p) => sum + p.plannedCost, 0) / waterfallProjects.length
      : 0;

    const chartData = {
      labels: ['Agile Projects', 'Waterfall Projects', 'Hybrid Projects'],
      agileData: [avgAgilePlanned, avgAgileActual, Math.abs(avgAgileActual - avgAgilePlanned)],
      waterfallData: [avgWaterfallPlanned, avgWaterfallActual, Math.abs(avgWaterfallActual - avgWaterfallPlanned)],
    };

    return {
      totalProjects,
      avgCostVariance: Math.round(avgCostVariance * 10) / 10,
      completedProjects,
      activeProjects,
      onHoldProjects,
      chartData,
      agileProjects: agileProjects.length,
      waterfallProjects: waterfallProjects.length,
      hybridProjects: hybridProjects.length,
      avgAgileActual,
      avgWaterfallActual,
      avgHybridActual,
    };
  }, [projects]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {currentUser?.displayName}
          </h1>
          <p className="text-gray-600 mt-1">
            Here's an overview of your project cost analysis
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Projects"
          value={dashboardData.totalProjects}
          icon={FolderOpen}
          color="blue"
          change={{ value: 8.2, type: 'increase' }}
        />
        <KPICard
          title="Avg Cost Variance"
          value={`${dashboardData.avgCostVariance}%`}
          icon={TrendingUp}
          color="green"
          change={{ value: 3.1, type: 'decrease' }}
        />
        <KPICard
          title="Completed Projects"
          value={dashboardData.completedProjects}
          icon={DollarSign}
          color="orange"
        />
        <KPICard
          title="Active Projects"
          value={dashboardData.activeProjects}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComparisonChart
          data={dashboardData.chartData}
          title="Cost Comparison: Agile vs Waterfall"
          yAxisLabel="Cost (USD)"
        />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Project Insights
          </h3>
          <div className="space-y-4">
            {dashboardData.totalProjects === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">No projects yet. Add some projects to see insights!</p>
              </div>
            ) : (
              <>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {dashboardData.agileProjects > 0 && dashboardData.waterfallProjects > 0
                        ? dashboardData.avgAgileActual < dashboardData.avgWaterfallActual
                          ? `Agile projects cost ${formatCurrency(dashboardData.avgWaterfallActual - dashboardData.avgAgileActual)} less on average`
                          : `Waterfall projects cost ${formatCurrency(dashboardData.avgAgileActual - dashboardData.avgWaterfallActual)} less on average`
                        : `You have ${dashboardData.agileProjects} Agile and ${dashboardData.waterfallProjects} Waterfall projects`
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      Based on your current project portfolio
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Cost variance is {dashboardData.avgCostVariance >= 0 ? 'over' : 'under'} budget by {Math.abs(dashboardData.avgCostVariance).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {dashboardData.avgCostVariance < 0 ? 'Great cost control!' : 'Monitor budget closely'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {dashboardData.completedProjects > 0
                        ? `${((dashboardData.completedProjects / dashboardData.totalProjects) * 100).toFixed(0)}% completion rate`
                        : 'No completed projects yet'
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {dashboardData.activeProjects > 0 && `${dashboardData.activeProjects} active projects in progress`}
                    </p>
                  </div>
                </div>
                {dashboardData.hybridProjects > 0 && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {dashboardData.hybridProjects} hybrid methodology projects
                      </p>
                      <p className="text-xs text-gray-500">
                        Average cost: {formatCurrency(dashboardData.avgHybridActual)}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <h4 className="font-medium text-gray-900">Add New Project</h4>
            <p className="text-sm text-gray-600 mt-1">
              Start tracking costs for a new project
            </p>
          </button>
          <button
            onClick={() => navigate('/analysis')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <h4 className="font-medium text-gray-900">Run Analysis</h4>
            <p className="text-sm text-gray-600 mt-1">
              Compare methodologies with current data
            </p>
          </button>
          <button
            onClick={() => {
              // Create CSV export functionality
              const csvData = projects.map(p => ({
                Name: p.name,
                Methodology: p.methodology,
                Industry: p.industry,
                Size: p.size,
                'Team Size': p.teamSize,
                'Start Date': p.startDate,
                'End Date': p.endDate || 'Ongoing',
                Status: p.status,
                'Planned Cost': p.plannedCost,
                'Actual Cost': p.actualCost
              }));

              const headers = Object.keys(csvData[0] || {});
              const csvContent = [
                headers.join(','),
                ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
              ].join('\n');

              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `projects-export-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
            }}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <h4 className="font-medium text-gray-900">Export Data</h4>
            <p className="text-sm text-gray-600 mt-1">
              Download project data as CSV
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
