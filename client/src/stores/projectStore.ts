import { create } from 'zustand';
import { projectsApi, chaptersApi } from '../services/api';
import type { Project, Chapter } from '@shared/types';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  chapters: Chapter[];
  currentChapter: Chapter | null;
  isLoading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  fetchProject: (id: string | number) => Promise<void>;
  createProject: (data: { title: string; description?: string; genre?: string }) => Promise<Project>;
  updateProject: (id: string | number, data: { title?: string; description?: string }) => Promise<void>;
  deleteProject: (id: string | number) => Promise<void>;

  fetchChapters: (projectId: string | number) => Promise<void>;
  fetchChapter: (id: string | number) => Promise<void>;
  createChapter: (data: { project_id: string | number; title: string; content?: string; chapter_outline?: string }) => Promise<Chapter>;
  updateChapter: (id: string | number, data: { title?: string; content?: string; sort_order?: number }) => Promise<void>;
  deleteChapter: (id: string | number) => Promise<void>;
  reorderChapters: (projectId: string | number, orders: { id: number; sort_order: number }[]) => Promise<void>;

  setCurrentProject: (project: Project | null) => void;
  setCurrentChapter: (chapter: Chapter | null) => void;
  clearCurrentProject: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  chapters: [],
  currentChapter: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await projectsApi.list();
      set({ projects, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch projects';
      set({ isLoading: false, error: message });
    }
  },

  fetchProject: async (id: string | number) => {
    set({ isLoading: true, error: null });
    try {
      const project = await projectsApi.get(id);
      set({ currentProject: project, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch project';
      set({ isLoading: false, error: message });
    }
  },

  createProject: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const project = await projectsApi.create(data);
      set((state) => ({
        projects: [...state.projects, project],
        isLoading: false,
      }));
      return project;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  updateProject: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await projectsApi.update(id, data);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
        currentProject: state.currentProject?.id === id ? updated : state.currentProject,
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update project';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  deleteProject: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await projectsApi.delete(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete project';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  fetchChapters: async (projectId: string | number) => {
    set({ isLoading: true, error: null });
    try {
      const chapters = await chaptersApi.list(projectId);
      set({ chapters, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch chapters';
      set({ isLoading: false, error: message });
    }
  },

  createChapter: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const chapter = await chaptersApi.create(data);
      set((state) => ({
        chapters: [...state.chapters, chapter],
        isLoading: false,
      }));
      return chapter;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create chapter';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  updateChapter: async (id, data) => {
    try {
      const updated = await chaptersApi.update(id, data);
      set((state) => ({
        chapters: state.chapters.map((c) => (c.id === id ? updated : c)),
        currentChapter: state.currentChapter?.id === id ? updated : state.currentChapter,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update chapter';
      set({ error: message });
      throw err;
    }
  },

  deleteChapter: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await chaptersApi.delete(id);
      set((state) => ({
        chapters: state.chapters.filter((c) => c.id !== id),
        currentChapter: state.currentChapter?.id === id ? null : state.currentChapter,
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete chapter';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  fetchChapter: async (id: string | number) => {
    try {
      const chapter = await chaptersApi.get(id);
      set({ currentChapter: chapter });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch chapter';
      set({ error: message });
    }
  },

  reorderChapters: async (_projectId: string | number, orders: { id: number; sort_order: number }[]) => {
    try {
      await Promise.all(
        orders.map((o) => chaptersApi.update(o.id, { sort_order: o.sort_order }))
      );
      // Refresh the local chapter list with updated sort_order
      set((state) => {
        const orderMap = new Map(orders.map((o) => [o.id, o.sort_order]));
        const updated = [...state.chapters]
          .map((c) => (orderMap.has(c.id) ? { ...c, sort_order: orderMap.get(c.id)! } : c))
          .sort((a, b) => a.sort_order - b.sort_order);
        return { chapters: updated };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reorder chapters';
      set({ error: message });
      throw err;
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  setCurrentChapter: (chapter) => set({ currentChapter: chapter }),

  clearCurrentProject: () =>
    set({
      currentProject: null,
      chapters: [],
      currentChapter: null,
    }),
}));
