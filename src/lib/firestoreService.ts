import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Project } from '../contexts/ProjectsContext';

export interface FirebaseProject extends Omit<Project, 'id' | 'startDate' | 'endDate'> {
  userId: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AnalysisResult {
  id?: string;
  userId: string;
  name: string;
  projectIds: string[];
  results: {
    summary: {
      totalProjects: number;
      agileProjects: number;
      waterfallProjects: number;
      hybridProjects: number;
    };
    metrics: Record<string, unknown>;
    recommendations: string[];
  };
  configuration: {
    methodology: string[];
    industry: string[];
    size: string[];
    dateRange: { start: string; end: string };
    metrics: string[];
    statisticalTest: 'ttest' | 'mannwhitney';
  };
  createdAt: Timestamp;
}

class FirestoreService {
  // Projects Collection
  private projectsCollection = 'projects';
  private analysisCollection = 'analysis';

  // Convert Project to Firestore format
  private projectToFirestore(project: Omit<Project, 'id'>, userId: string): Omit<FirebaseProject, 'id'> {
    const baseData = {
      name: project.name,
      methodology: project.methodology,
      industry: project.industry,
      size: project.size,
      teamSize: project.teamSize,
      status: project.status,
      plannedCost: project.plannedCost,
      actualCost: project.actualCost,
      userId,
      startDate: Timestamp.fromDate(new Date(project.startDate)),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Only add endDate if it exists and is not undefined/null
    if (project.endDate && project.endDate.trim() !== '') {
      return {
        ...baseData,
        endDate: Timestamp.fromDate(new Date(project.endDate))
      };
    }

    return baseData;
  }

  // Convert Firestore data to Project format
  private firestoreToProject(data: FirebaseProject, id: string): Project {
    return {
      id,
      name: data.name,
      methodology: data.methodology,
      industry: data.industry,
      size: data.size,
      teamSize: data.teamSize,
      startDate: data.startDate.toDate().toISOString().split('T')[0],
      endDate: data.endDate ? data.endDate.toDate().toISOString().split('T')[0] : undefined,
      status: data.status,
      plannedCost: data.plannedCost,
      actualCost: data.actualCost,
    };
  }

  // Project CRUD Operations
  async addProject(project: Omit<Project, 'id'>, userId: string): Promise<string> {
    try {
      console.log('FirestoreService: Adding project for user:', userId);
      const firestoreProject = this.projectToFirestore(project, userId);
      console.log('FirestoreService: Converted project data:', firestoreProject);
      const docRef = await addDoc(collection(db, this.projectsCollection), firestoreProject);
      console.log('FirestoreService: Project added successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error: unknown) {
      console.error('FirestoreService: Error adding project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : undefined;
      console.error('FirestoreService: Error code:', errorCode);
      console.error('FirestoreService: Error message:', errorMessage);
      if (errorCode === 'permission-denied') {
        throw new Error('Permission denied: Please check Firestore security rules');
      }
      throw new Error(`Failed to add project: ${errorMessage}`);
    }
  }

  async updateProject(projectId: string, project: Omit<Project, 'id'>, userId: string): Promise<void> {
    try {
      const projectRef = doc(db, this.projectsCollection, projectId);
      const updateData = {
        ...this.projectToFirestore(project, userId),
        updatedAt: Timestamp.now(),
      };
      await updateDoc(projectRef, updateData);
    } catch (error) {
      console.error('Error updating project:', error);
      throw new Error('Failed to update project');
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      const projectRef = doc(db, this.projectsCollection, projectId);
      await deleteDoc(projectRef);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw new Error('Failed to delete project');
    }
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    try {
      const q = query(
        collection(db, this.projectsCollection),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc =>
        this.firestoreToProject(doc.data() as FirebaseProject, doc.id)
      );
    } catch (error) {
      console.error('Error getting user projects:', error);
      throw new Error('Failed to get projects');
    }
  }

  // Real-time listener for user projects
  subscribeToUserProjects(userId: string, callback: (projects: Project[]) => void): () => void {
    const q = query(
      collection(db, this.projectsCollection),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      console.log('FirestoreService: Snapshot received with', querySnapshot.docs.length, 'documents');
      const projects = querySnapshot.docs.map(doc => {
        const data = doc.data() as FirebaseProject;
        console.log('FirestoreService: Processing document:', doc.id, data);
        return this.firestoreToProject(data, doc.id);
      });
      console.log('FirestoreService: Converted projects:', projects);
      callback(projects);
    }, (error) => {
      console.error('FirestoreService: Error in projects subscription:', error);
    });
  }

  // Analysis Results Operations
  async saveAnalysisResult(analysis: Omit<AnalysisResult, 'id' | 'createdAt'>): Promise<string> {
    try {
      const analysisData = {
        ...analysis,
        createdAt: Timestamp.now(),
      };
      const docRef = await addDoc(collection(db, this.analysisCollection), analysisData);
      return docRef.id;
    } catch (error) {
      console.error('Error saving analysis result:', error);
      throw new Error('Failed to save analysis result');
    }
  }

  async getUserAnalysisResults(userId: string): Promise<AnalysisResult[]> {
    try {
      const q = query(
        collection(db, this.analysisCollection),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AnalysisResult));
    } catch (error) {
      console.error('Error getting analysis results:', error);
      throw new Error('Failed to get analysis results');
    }
  }

  async deleteAnalysisResult(analysisId: string): Promise<void> {
    try {
      const analysisRef = doc(db, this.analysisCollection, analysisId);
      await deleteDoc(analysisRef);
    } catch (error) {
      console.error('Error deleting analysis result:', error);
      throw new Error('Failed to delete analysis result');
    }
  }

  // Batch operations for initial data migration
  async migrateProjectsToFirestore(projects: Project[], userId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      projects.forEach((project) => {
        const docRef = doc(collection(db, this.projectsCollection));
        const firestoreProject = this.projectToFirestore(project, userId);
        batch.set(docRef, firestoreProject);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error migrating projects:', error);
      throw new Error('Failed to migrate projects');
    }
  }
}

export const firestoreService = new FirestoreService();
