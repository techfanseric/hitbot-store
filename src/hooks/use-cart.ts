'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cart-store';
import { useProcurementStore } from '@/lib/procurement-store';

/**
 * 包装 useCart，处理 SSR hydration：
 * - 服务端渲染时 cart 为空
 * - 客户端 hydrate 后才是 localStorage 的真实值
 * 用 hydrated 标志位让调用方决定是否渲染数字角标等。
 */
export function useCartSafe() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const projectId = useCart((s) => s.projectId);
  const projectName = useCart((s) => s.projectName);
  const projects = useCart((s) => s.projects);
  const purchaseContextId = useCart((s) => s.purchaseContextId);
  const setPurchaseContext = useCart((s) => s.setPurchaseContext);
  const currentProjectId = useCart((s) => s.currentProjectId);
  const items = useCart((s) => s.items);
  const setProject = useCart((s) => s.setProject);
  const add = useCart((s) => s.add);
  const importOsBom = useCart((s) => s.importOsBom);
  const remove = useCart((s) => s.remove);
  const setQty = useCart((s) => s.setQty);
  const setSelected = useCart((s) => s.setSelected);
  const syncProject = useCart((s) => s.syncProject);
  const clear = useCart((s) => s.clear);
  const isAuthenticated = useProcurementStore((s) => s.isAuthenticated);
  const profile = useProcurementStore((s) => s.profile);
  const activePurchaseContext = useProcurementStore((s) => s.activePurchaseContext);

  useEffect(() => {
    if (!hydrated) return;
    const nextContextId =
      isAuthenticated && activePurchaseContext
        ? activePurchaseContext.contextId
        : 'guest:anonymous';
    const nextContextKind = activePurchaseContext?.kind ?? 'personal';
    const nextEnterpriseId = isAuthenticated ? profile.enterpriseId : 'ENT-HITBOT-GUEST';
    const nextCompanyName = isAuthenticated ? profile.companyName : '访客购物车';
    setPurchaseContext(nextContextId, nextContextKind, nextEnterpriseId, nextCompanyName);
  }, [
    activePurchaseContext,
    hydrated,
    isAuthenticated,
    profile.companyName,
    profile.enterpriseId,
    setPurchaseContext,
  ]);

  const scopedProjects = projects.filter(
    (project) =>
      (project.purchaseContextId ?? `organization:${project.enterpriseId}`) === purchaseContextId,
  );

  const count = items.reduce((n, i) => n + i.qty, 0);
  const selectedCount = items.reduce((n, i) => n + (i.selected ? i.qty : 0), 0);
  return {
    projectId,
    projectName,
    projects: scopedProjects,
    currentProjectId,
    items,
    count,
    selectedCount,
    hydrated,
    setProject,
    add,
    importOsBom,
    remove,
    setQty,
    setSelected,
    syncProject,
    clear,
  };
}
