import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { firestoreService } from '../lib/firestoreService';

export interface Project {
  id: string;
  name: string;
  methodology: 'Agile' | 'Waterfall' | 'Hybrid';
  industry: string;
  size: 'Small' | 'Medium' | 'Large';
  teamSize: number;
  startDate: string;
  endDate?: string;
  status: 'Active' | 'Completed' | 'On Hold';
  plannedCost: number;
  actualCost: number;
}

interface ProjectsContextType {
  projects: Project[];
  loading: boolean;
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (id: string, project: Omit<Project, 'id'>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProjectById: (id: string) => Project | undefined;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};

const STORAGE_KEY = 'cost-analysis-projects';

// Sample/default projects
const defaultProjects: Project[] = [
  {
    id: '1',
    name: 'E-commerce Platform Redesign',
    methodology: 'Agile',
    industry: 'E-commerce',
    size: 'Large',
    teamSize: 12,
    startDate: '2024-01-15',
    endDate: '2024-06-30',
    status: 'Active',
    plannedCost: 250000,
    actualCost: 235000,
  },
  {
    id: '2',
    name: 'Healthcare Management System',
    methodology: 'Waterfall',
    industry: 'Healthcare',
    size: 'Medium',
    teamSize: 8,
    startDate: '2023-09-01',
    endDate: '2024-03-15',
    status: 'Completed',
    plannedCost: 180000,
    actualCost: 195000,
  },
  {
    id: '3',
    name: 'Mobile Banking App',
    methodology: 'Agile',
    industry: 'Finance',
    size: 'Medium',
    teamSize: 6,
    startDate: '2024-02-01',
    status: 'Active',
    plannedCost: 150000,
    actualCost: 142000,
  },
  {
    id: '4',
    name: 'Corporate Website Revamp',
    methodology: 'Hybrid',
    industry: 'Technology',
    size: 'Small',
    teamSize: 4,
    startDate: '2024-03-01',
    endDate: '2024-05-15',
    status: 'Completed',
    plannedCost: 85000,
    actualCost: 78000,
  },
  {
    id: '5',
    name: 'Inventory Management System',
    methodology: 'Waterfall',
    industry: 'Retail',
    size: 'Medium',
    teamSize: 7,
    startDate: '2024-01-10',
    status: 'On Hold',
    plannedCost: 120000,
    actualCost: 95000,
  },
];

export const ProjectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrated, setMigrated] = useState(false);

  // Load projects from Firestore on user authentication
  useEffect(() => {
    if (!currentUser) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Check for localStorage data to migrate
    const migrateFromLocalStorage = async () => {
      if (migrated) return;

      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        let projectsToMigrate: Project[] = [];

        if (stored) {
          const parsedProjects = JSON.parse(stored);
          projectsToMigrate = parsedProjects;
        } else {
          // Use default projects for new users
          projectsToMigrate = defaultProjects;
        }

        // Migrate to Firestore if we have projects
        if (projectsToMigrate.length > 0) {
          await firestoreService.migrateProjectsToFirestore(projectsToMigrate, currentUser.uid);
          localStorage.removeItem(STORAGE_KEY); // Clean up localStorage
        }

        setMigrated(true);
      } catch (error) {
        console.error('Error migrating projects:', error);
      }
    };

    // Subscribe to real-time updates from Firestore
    const unsubscribe = firestoreService.subscribeToUserProjects(
      currentUser.uid,
      (firestoreProjects) => {
        console.log('Real-time update received:', firestoreProjects.length, 'projects');
        setProjects(firestoreProjects);
        setLoading(false);
      }
    );

    // Temporarily disable migration to avoid undefined field errors
    // migrateFromLocalStorage().then(() => {
    //   // If no projects after migration, the subscription will handle the empty state
    // });

    // Mark as migrated to skip the process
    setMigrated(true);

    return () => {
      unsubscribe();
    };
  }, [currentUser, migrated]);

  const addProject = async (projectData: Omit<Project, 'id'>) => {
    if (!currentUser) throw new Error('User not authenticated');

    try {
      console.log('Adding project:', projectData.name);
      const projectId = await firestoreService.addProject(projectData, currentUser.uid);
      console.log('Project added with ID:', projectId);
      // The real-time listener will update the local state
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  };

  const updateProject = async (id: string, projectData: Omit<Project, 'id'>) => {
    if (!currentUser) throw new Error('User not authenticated');

    try {
      await firestoreService.updateProject(id, projectData, currentUser.uid);
      // The real-time listener will update the local state
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    if (!currentUser) throw new Error('User not authenticated');

    try {
      await firestoreService.deleteProject(id);
      // The real-time listener will update the local state
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  const getProjectById = (id: string) => {
    return projects.find(project => project.id === id);
  };

  const value = {
    projects,
    loading,
    addProject,
    updateProject,
    deleteProject,
    getProjectById,
  };

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
};
