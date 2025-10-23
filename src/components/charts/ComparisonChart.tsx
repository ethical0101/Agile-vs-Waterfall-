import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ComparisonChartProps {
  data: {
    labels: string[];
    agileData: number[];
    waterfallData: number[];
  };
  title: string;
  yAxisLabel?: string;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  data,
  title,
  yAxisLabel = 'Cost ($)'
}) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Agile',
        data: data.agileData,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Waterfall',
        data: data.waterfallData,
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderColor: 'rgba(249, 115, 22, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: yAxisLabel,
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <Bar data={chartData} options={options} />
    </div>
  );
};