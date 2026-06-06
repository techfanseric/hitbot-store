'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, CartProject, OsBomImportInput } from '@/types/cart';
import type { PartClass } from '@/types/product';

const DEFAULT_PROJECT_ID = 'web-catalog';
const DEFAULT_PROJECT_NAME = '官网商品选购';
const DEFAULT_ENTERPRISE_ID = 'ENT-HITBOT-CUSTOMER';
const DEFAULT_COMPANY_NAME = '深圳智造装备有限公司';

interface AddOptions {
  source?: CartItem['source'];
  sellable?: boolean;
  selected?: boolean;
  quoteRequired?: boolean;
}

interface CartState {
  enterpriseId: string;
  companyName: string;
  currentProjectId: string;
  projects: CartProject[];
  projectId: string;
  projectName: string;
  items: CartItem[];
  setEnterpriseContext: (enterpriseId: string, companyName?: string) => void;
  setProject: (projectId: string) => void;
  add: (productId: string, partClass: PartClass, qty?: number, options?: AddOptions) => void;
  importOsBom: (input: OsBomImportInput) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  setSelected: (productId: string, selected: boolean) => void;
  syncProject: () => void;
  clear: () => void;
}

const defaultProject: CartProject = {
  enterpriseId: DEFAULT_ENTERPRISE_ID,
  companyName: DEFAULT_COMPANY_NAME,
  projectId: DEFAULT_PROJECT_ID,
  projectName: DEFAULT_PROJECT_NAME,
  source: 'web',
  items: [],
  updatedAt: Date.now(),
};

function projectEnterpriseId(project: CartProject) {
  return project.enterpriseId ?? DEFAULT_ENTERPRISE_ID;
}

function activeProjects(
  state: Pick<CartState, 'projects' | 'enterpriseId' | 'companyName'>,
): CartProject[] {
  const scoped = state.projects.filter(
    (project) => projectEnterpriseId(project) === state.enterpriseId,
  );

  if (scoped.length > 0) return scoped;

  return [
    {
      ...defaultProject,
      enterpriseId: state.enterpriseId,
      companyName: state.companyName,
      updatedAt: Date.now(),
    },
  ];
}

function activeProject(
  state: Pick<CartState, 'projects' | 'currentProjectId' | 'enterpriseId' | 'companyName'>,
): CartProject {
  const scopedProjects = activeProjects(state);
  return (
    scopedProjects.find((project) => project.projectId === state.currentProjectId) ??
    scopedProjects[0]
  );
}

function syncActiveFields(project: CartProject) {
  return {
    enterpriseId: project.enterpriseId ?? DEFAULT_ENTERPRISE_ID,
    companyName: project.companyName ?? DEFAULT_COMPANY_NAME,
    currentProjectId: project.projectId,
    projectId: project.projectId,
    projectName: project.projectName,
    items: project.items,
  };
}

function updateProject(
  state: CartState,
  projectId: string,
  updater: (project: CartProject) => CartProject,
) {
  const fallback = activeProject(state);
  const target =
    state.projects.find(
      (project) =>
        project.projectId === projectId && projectEnterpriseId(project) === state.enterpriseId,
    ) ?? fallback;
  const updated = {
    ...updater(target),
    enterpriseId: state.enterpriseId,
    companyName: state.companyName,
  };
  const projects = state.projects.some(
    (project) =>
      project.projectId === updated.projectId &&
      projectEnterpriseId(project) === state.enterpriseId,
  )
    ? state.projects.map((project) =>
        project.projectId === updated.projectId &&
        projectEnterpriseId(project) === state.enterpriseId
          ? updated
          : project,
      )
    : [...state.projects, updated];

  return {
    projects,
    ...syncActiveFields(updated),
  };
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      currentProjectId: DEFAULT_PROJECT_ID,
      enterpriseId: DEFAULT_ENTERPRISE_ID,
      companyName: DEFAULT_COMPANY_NAME,
      projects: [defaultProject],
      projectId: DEFAULT_PROJECT_ID,
      projectName: DEFAULT_PROJECT_NAME,
      items: [],
      setEnterpriseContext: (enterpriseId, companyName = DEFAULT_COMPANY_NAME) =>
        set((state) => {
          if (state.enterpriseId === enterpriseId && state.companyName === companyName) {
            return state;
          }

          const scopedProjects = activeProjects({
            projects: state.projects,
            enterpriseId,
            companyName,
          });
          const nextProject =
            scopedProjects.find((project) => project.projectId === state.currentProjectId) ??
            scopedProjects[0];

          return syncActiveFields({
            ...nextProject,
            enterpriseId,
            companyName,
          });
        }),
      setProject: (projectId) =>
        set((state) => {
          const nextProject =
            state.projects.find(
              (project) =>
                project.projectId === projectId &&
                projectEnterpriseId(project) === state.enterpriseId,
            ) ?? activeProject(state);
          return syncActiveFields(nextProject);
        }),
      add: (productId, partClass, qty = 1, options = {}) =>
        set((s) => {
          const currentProject = activeProject(s);
          return updateProject(s, currentProject.projectId, (project) => {
            const ex = project.items.find((i) => i.productId === productId);
            const sellable = options.sellable ?? partClass === 'standard';
            const quoteRequired = options.quoteRequired ?? !sellable;
            const nextItems = ex
              ? project.items.map((i) =>
                  i.productId === productId
                    ? {
                        ...i,
                        qty: i.qty + qty,
                        selected: i.selected || options.selected !== false,
                        syncStatus: 'local' as const,
                      }
                    : i,
                )
              : [
                  ...project.items,
                  {
                    productId,
                    partClass,
                    qty,
                    source: options.source ?? 'web',
                    selected: options.selected ?? sellable,
                    sellable,
                    quoteRequired,
                    syncStatus: 'local' as const,
                    addedAt: Date.now(),
                  },
                ];
            return {
              ...project,
              source: project.source === 'os' || options.source === 'os' ? 'os' : 'web',
              items: nextItems,
              updatedAt: Date.now(),
            };
          });
        }),
      importOsBom: ({ projectId, projectName, items, replace = false }) =>
        set((state) => {
          const existing = state.projects.find(
            (project) =>
              project.projectId === projectId &&
              projectEnterpriseId(project) === state.enterpriseId,
          );
          const baseProject: CartProject = existing ?? {
            enterpriseId: state.enterpriseId,
            companyName: state.companyName,
            projectId,
            projectName,
            source: 'os',
            items: [],
            updatedAt: Date.now(),
          };
          const incomingItems = items.map((item) => {
            const sellable = item.sellable ?? item.partClass === 'standard';
            return {
              productId: item.productId,
              partClass: item.partClass,
              qty: item.qty,
              source: 'os' as const,
              selected: item.selected ?? sellable,
              sellable,
              quoteRequired: item.quoteRequired ?? !sellable,
              syncStatus: 'pending' as const,
              addedAt: Date.now(),
            };
          });
          const mergedItems = replace
            ? incomingItems
            : incomingItems.reduce<CartItem[]>((nextItems, incoming) => {
                const current = nextItems.find((item) => item.productId === incoming.productId);
                if (!current) return [...nextItems, incoming];
                return nextItems.map((item) =>
                  item.productId === incoming.productId
                    ? { ...item, ...incoming, qty: current.qty + incoming.qty }
                    : item,
                );
              }, baseProject.items);
          const updatedProject: CartProject = {
            ...baseProject,
            enterpriseId: state.enterpriseId,
            companyName: state.companyName,
            projectName,
            source: 'os',
            items: mergedItems,
            updatedAt: Date.now(),
          };
          const projects = state.projects.some(
            (project) =>
              project.projectId === projectId &&
              projectEnterpriseId(project) === state.enterpriseId,
          )
            ? state.projects.map((project) =>
                project.projectId === projectId &&
                projectEnterpriseId(project) === state.enterpriseId
                  ? updatedProject
                  : project,
              )
            : [updatedProject, ...state.projects];

          return {
            projects,
            ...syncActiveFields(updatedProject),
          };
        }),
      remove: (productId) =>
        set((s) =>
          updateProject(s, s.currentProjectId, (project) => ({
            ...project,
            items: project.items.filter((i) => i.productId !== productId),
            updatedAt: Date.now(),
          })),
        ),
      setQty: (productId, qty) =>
        set((s) => {
          const nextQty = Math.max(0, qty);
          return updateProject(s, s.currentProjectId, (project) => ({
            ...project,
            items:
              nextQty === 0
                ? project.items.filter((i) => i.productId !== productId)
                : project.items.map((i) =>
                    i.productId === productId
                      ? { ...i, qty: nextQty, syncStatus: 'local' as const }
                      : i,
                  ),
            updatedAt: Date.now(),
          }));
        }),
      setSelected: (productId, selected) =>
        set((s) =>
          updateProject(s, s.currentProjectId, (project) => ({
            ...project,
            items: project.items.map((i) =>
              i.productId === productId ? { ...i, selected, syncStatus: 'local' as const } : i,
            ),
            updatedAt: Date.now(),
          })),
        ),
      syncProject: () =>
        set((s) =>
          updateProject(s, s.currentProjectId, (project) => ({
            ...project,
            items: project.items.map((item) => ({ ...item, syncStatus: 'synced' as const })),
            updatedAt: Date.now(),
          })),
        ),
      clear: () =>
        set((s) =>
          updateProject(s, s.currentProjectId, (project) => ({
            ...project,
            items: [],
            updatedAt: Date.now(),
          })),
        ),
    }),
    {
      name: 'hitbot-cart-v2',
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<CartState>;
        const persistedProjects = persisted.projects;
        const legacyProject: CartProject = {
          ...defaultProject,
          enterpriseId: DEFAULT_ENTERPRISE_ID,
          companyName: DEFAULT_COMPANY_NAME,
          projectId: persisted.projectId ?? DEFAULT_PROJECT_ID,
          projectName: persisted.projectName ?? DEFAULT_PROJECT_NAME,
          items: persisted.items ?? [],
          updatedAt: Date.now(),
        };
        const projects =
          persistedProjects && persistedProjects.length > 0
            ? persistedProjects.map((project) => ({
                ...project,
                enterpriseId: project.enterpriseId ?? DEFAULT_ENTERPRISE_ID,
                companyName: project.companyName ?? DEFAULT_COMPANY_NAME,
              }))
            : [legacyProject];
        const enterpriseId = persisted.enterpriseId ?? DEFAULT_ENTERPRISE_ID;
        const companyName = persisted.companyName ?? DEFAULT_COMPANY_NAME;
        const currentProjectId = persisted.currentProjectId ?? legacyProject.projectId;
        const project =
          projects.find(
            (item) =>
              item.projectId === currentProjectId && projectEnterpriseId(item) === enterpriseId,
          ) ?? activeProjects({ projects, enterpriseId, companyName })[0];

        return {
          ...currentState,
          ...persisted,
          projects,
          ...syncActiveFields({
            ...project,
            enterpriseId,
            companyName,
          }),
        };
      },
    },
  ),
);
