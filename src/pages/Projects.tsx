import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Calendar,
  Users,
  Building,
  FolderOpen,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProjects, Project } from '../contexts/ProjectsContext';

export const Projects: React.FC = () => {
  const { projects, addProject, updateProject, deleteProject } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethodology, setSelectedMethodology] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Form state for adding/editing projects
  const [projectForm, setProjectForm] = useState({
    name: '',
    methodology: '' as 'Agile' | 'Waterfall' | 'Hybrid' | '',
    industry: '',
    size: '' as 'Small' | 'Medium' | 'Large' | '',
    teamSize: '',
    startDate: '',
    endDate: '',
    status: 'Active' as 'Active' | 'Completed' | 'On Hold',
    plannedCost: '',
    actualCost: ''
  });

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethodology = !selectedMethodology || project.methodology === selectedMethodology;
    return matchesSearch && matchesMethodology;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      case 'On Hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodologyColor = (methodology: string) => {
    switch (methodology) {
      case 'Agile':
        return 'bg-blue-100 text-blue-800';
      case 'Waterfall':
        return 'bg-orange-100 text-orange-800';
      case 'Hybrid':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const resetForm = () => {
    setProjectForm({
      name: '',
      methodology: '',
      industry: '',
      size: '',
      teamSize: '',
      startDate: '',
      endDate: '',
      status: 'Active',
      plannedCost: '',
      actualCost: ''
    });
  };

  const handleAddProject = async () => {
    // Debug: Check which fields are missing
    const requiredFields = {
      name: projectForm.name,
      methodology: projectForm.methodology,
      industry: projectForm.industry,
      size: projectForm.size,
      teamSize: projectForm.teamSize,
      startDate: projectForm.startDate,
      plannedCost: projectForm.plannedCost
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => !value || value === '')
      .map(([key]) => key);

    if (missingFields.length > 0) {
      setMessage(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const newProjectData = {
        name: projectForm.name,
        methodology: projectForm.methodology as 'Agile' | 'Waterfall' | 'Hybrid',
        industry: projectForm.industry,
        size: projectForm.size as 'Small' | 'Medium' | 'Large',
        teamSize: parseInt(projectForm.teamSize),
        startDate: projectForm.startDate,
        endDate: projectForm.endDate || undefined,
        status: projectForm.status,
        plannedCost: parseFloat(projectForm.plannedCost),
        actualCost: parseFloat(projectForm.actualCost) || 0
      };

      await addProject(newProjectData);
      setShowAddModal(false);
      resetForm();
      setMessage('Project created successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      methodology: project.methodology,
      industry: project.industry,
      size: project.size,
      teamSize: project.teamSize.toString(),
      startDate: project.startDate,
      endDate: project.endDate || '',
      status: project.status,
      plannedCost: project.plannedCost.toString(),
      actualCost: project.actualCost.toString()
    });
    setShowAddModal(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;

    // Validate required fields for update
    const requiredFields = {
      name: projectForm.name,
      methodology: projectForm.methodology,
      industry: projectForm.industry,
      size: projectForm.size,
      teamSize: projectForm.teamSize,
      startDate: projectForm.startDate,
      plannedCost: projectForm.plannedCost
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => !value || value === '')
      .map(([key]) => key);

    if (missingFields.length > 0) {
      setMessage(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const updatedProjectData = {
        name: projectForm.name,
        methodology: projectForm.methodology as 'Agile' | 'Waterfall' | 'Hybrid',
        industry: projectForm.industry,
        size: projectForm.size as 'Small' | 'Medium' | 'Large',
        teamSize: parseInt(projectForm.teamSize),
        startDate: projectForm.startDate,
        endDate: projectForm.endDate || undefined,
        status: projectForm.status,
        plannedCost: parseFloat(projectForm.plannedCost),
        actualCost: parseFloat(projectForm.actualCost) || 0
      };

      await updateProject(editingProject.id, updatedProjectData);
      setShowAddModal(false);
      setEditingProject(null);
      resetForm();
      setMessage('Project updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(projectId);
        setMessage('Project deleted successfully!');
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage('Failed to delete project. Please try again.');
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingProject(null);
    resetForm();
    setMessage('');
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-lg ${
          message.includes('successfully') || message.includes('created') || message.includes('updated') || message.includes('deleted')
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            Manage your project portfolio and track costs
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              if (filteredProjects.length === 0) {
                setMessage('No projects to export');
                setTimeout(() => setMessage(''), 3000);
                return;
              }

              try {
                // Create CSV data
                const headers = [
                  'Name', 'Methodology', 'Industry', 'Size', 'Team Size',
                  'Start Date', 'End Date', 'Status', 'Planned Cost', 'Actual Cost'
                ];

                const csvData = filteredProjects.map(project => [
                  project.name,
                  project.methodology,
                  project.industry,
                  project.size,
                  project.teamSize.toString(),
                  project.startDate,
                  project.endDate || 'Ongoing',
                  project.status,
                  project.plannedCost.toString(),
                  project.actualCost.toString()
                ]);

                // Create CSV content
                const csvContent = [
                  headers.join(','),
                  ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
                ].join('\n');

                // Download the file
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `projects-export-${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                setMessage('Projects exported successfully!');
                setTimeout(() => setMessage(''), 3000);
              } catch (error) {
                console.error('Error exporting CSV:', error);
                setMessage('Failed to export CSV. Please try again.');
                setTimeout(() => setMessage(''), 3000);
              }
            }}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={selectedMethodology}
                onChange={(e) => setSelectedMethodology(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Filter by methodology"
              >
                <option value="">All Methodologies</option>
                <option value="Agile">Agile</option>
                <option value="Waterfall">Waterfall</option>
                <option value="Hybrid">Hybrid</option>
              </select>
              <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Methodology
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Industry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {project.name}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        {project.startDate}
                        {project.endDate && ` - ${project.endDate}`}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMethodologyColor(project.methodology)}`}>
                      {project.methodology}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Building className="w-4 h-4 mr-2 text-gray-400" />
                      {project.industry}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Users className="w-4 h-4 mr-2 text-gray-400" />
                      {project.teamSize}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>Planned: {formatCurrency(project.plannedCost)}</div>
                      <div className={`${project.actualCost > project.plannedCost ? 'text-red-600' : 'text-green-600'}`}>
                        Actual: {formatCurrency(project.actualCost)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditProject(project)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit project"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-4" />
              <p>No projects found matching your criteria</p>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingProject ? 'Edit Project' : 'Add New Project'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {message && (
              <div className={`mb-4 p-3 rounded-lg ${
                message.includes('success')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Methodology *
                </label>
                <select
                  value={projectForm.methodology}
                  onChange={(e) => setProjectForm({...projectForm, methodology: e.target.value as 'Agile' | 'Waterfall' | 'Hybrid'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Project methodology"
                  required
                >
                  <option value="">Select methodology</option>
                  <option value="Agile">Agile</option>
                  <option value="Waterfall">Waterfall</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry *
                </label>
                <input
                  type="text"
                  value={projectForm.industry}
                  onChange={(e) => setProjectForm({...projectForm, industry: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Healthcare, Finance, E-commerce"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Size *
                </label>
                <select
                  value={projectForm.size}
                  onChange={(e) => setProjectForm({...projectForm, size: e.target.value as 'Small' | 'Medium' | 'Large'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Project size"
                  required
                >
                  <option value="">Select size</option>
                  <option value="Small">Small (1-5 people)</option>
                  <option value="Medium">Medium (6-15 people)</option>
                  <option value="Large">Large (16+ people)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Size *
                </label>
                <input
                  type="number"
                  value={projectForm.teamSize}
                  onChange={(e) => setProjectForm({...projectForm, teamSize: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Number of team members"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={projectForm.startDate}
                  onChange={(e) => setProjectForm({...projectForm, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Project start date"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={projectForm.endDate}
                  onChange={(e) => setProjectForm({...projectForm, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Project end date"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={projectForm.status}
                  onChange={(e) => setProjectForm({...projectForm, status: e.target.value as 'Active' | 'Completed' | 'On Hold'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Project status"
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Planned Cost ($) *
                </label>
                <input
                  type="number"
                  value={projectForm.plannedCost}
                  onChange={(e) => setProjectForm({...projectForm, plannedCost: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Cost ($)
                </label>
                <input
                  type="number"
                  value={projectForm.actualCost}
                  onChange={(e) => setProjectForm({...projectForm, actualCost: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={editingProject ? handleUpdateProject : handleAddProject}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingProject ? 'Update Project' : 'Create Project')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
