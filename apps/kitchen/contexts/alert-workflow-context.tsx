"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface WorkflowAlert {
    id: string;
    type: 'temperature' | 'cleaning' | 'dlc';
    title: string;
    message: string;
    severity: 'warning' | 'critical';
    actionUrl: string;
    targetId?: string; // ID of the specific item to highlight/select
    areaId?: string; // For cleaning: area to select
}

interface AlertWorkflowContextType {
    // Workflow state
    isWorkflowActive: boolean;
    alerts: WorkflowAlert[];
    currentAlertIndex: number;
    currentAlert: WorkflowAlert | null;
    isTransitioning: boolean;
    workflowKey: number; // Increments on each alert change to force re-render

    // Actions
    startWorkflow: (alerts: WorkflowAlert[]) => void;
    nextAlert: () => void;
    skipAlert: () => void;
    exitWorkflow: () => void;
    markCurrentAsResolved: () => void;

    // For pages to check if they should highlight something
    getTargetForPage: (pageType: 'temperature' | 'cleaning' | 'dlc') => { targetId?: string; areaId?: string } | null;
}

const AlertWorkflowContext = createContext<AlertWorkflowContextType | undefined>(undefined);

export function AlertWorkflowProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isWorkflowActive, setIsWorkflowActive] = useState(false);
    const [alerts, setAlerts] = useState<WorkflowAlert[]>([]);
    const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [workflowKey, setWorkflowKey] = useState(0);

    const currentAlert = isWorkflowActive && alerts.length > 0 && currentAlertIndex < alerts.length
        ? alerts[currentAlertIndex]
        : null;

    // Navigate to alert with transition
    const navigateToAlert = useCallback((alert: WorkflowAlert) => {
        setIsTransitioning(true);

        // Small delay for visual transition
        setTimeout(() => {
            setWorkflowKey(prev => prev + 1);
            router.push(alert.actionUrl);

            // End transition after navigation
            setTimeout(() => {
                setIsTransitioning(false);
            }, 300);
        }, 150);
    }, [router]);

    const startWorkflow = useCallback((newAlerts: WorkflowAlert[]) => {
        if (newAlerts.length === 0) return;

        // Sort alerts: group by type for smoother navigation
        // Order: cleaning first, then temperature, then dlc
        const sortedAlerts = [...newAlerts].sort((a, b) => {
            const typeOrder = { cleaning: 0, temperature: 1, dlc: 2 };
            return typeOrder[a.type] - typeOrder[b.type];
        });

        setAlerts(sortedAlerts);
        setCurrentAlertIndex(0);
        setIsWorkflowActive(true);
        setWorkflowKey(prev => prev + 1);

        // Navigate to first alert
        navigateToAlert(sortedAlerts[0]);
    }, [navigateToAlert]);

    const navigateToNextOrFinish = useCallback(() => {
        if (isTransitioning) return; // Prevent double clicks

        const nextIndex = currentAlertIndex + 1;

        if (nextIndex >= alerts.length) {
            // All alerts processed, return to dashboard
            setIsTransitioning(true);
            setTimeout(() => {
                setIsWorkflowActive(false);
                setAlerts([]);
                setCurrentAlertIndex(0);
                setIsTransitioning(false);
                router.push('/dashboard');
            }, 150);
            return;
        }

        setCurrentAlertIndex(nextIndex);
        navigateToAlert(alerts[nextIndex]);
    }, [currentAlertIndex, alerts, router, navigateToAlert, isTransitioning]);

    const nextAlert = useCallback(() => {
        navigateToNextOrFinish();
    }, [navigateToNextOrFinish]);

    const skipAlert = useCallback(() => {
        navigateToNextOrFinish();
    }, [navigateToNextOrFinish]);

    const markCurrentAsResolved = useCallback(() => {
        if (isTransitioning) return; // Prevent double calls

        // Remove current alert from list and proceed
        const newAlerts = alerts.filter((_, idx) => idx !== currentAlertIndex);

        if (newAlerts.length === 0) {
            // All done!
            setIsTransitioning(true);
            setTimeout(() => {
                setIsWorkflowActive(false);
                setAlerts([]);
                setCurrentAlertIndex(0);
                setIsTransitioning(false);
                router.push('/dashboard');
            }, 150);
            return;
        }

        // Stay at same index (or adjust if at end)
        const newIndex = currentAlertIndex >= newAlerts.length ? newAlerts.length - 1 : currentAlertIndex;
        setAlerts(newAlerts);
        setCurrentAlertIndex(newIndex);
        navigateToAlert(newAlerts[newIndex]);
    }, [alerts, currentAlertIndex, router, navigateToAlert, isTransitioning]);

    const exitWorkflow = useCallback(() => {
        setIsTransitioning(true);
        setTimeout(() => {
            setIsWorkflowActive(false);
            setAlerts([]);
            setCurrentAlertIndex(0);
            setIsTransitioning(false);
            router.push('/dashboard');
        }, 150);
    }, [router]);

    const getTargetForPage = useCallback((pageType: 'temperature' | 'cleaning' | 'dlc') => {
        if (!isWorkflowActive || !currentAlert || isTransitioning) return null;
        if (currentAlert.type !== pageType) return null;

        return {
            targetId: currentAlert.targetId,
            areaId: currentAlert.areaId
        };
    }, [isWorkflowActive, currentAlert, isTransitioning]);

    return (
        <AlertWorkflowContext.Provider value={{
            isWorkflowActive,
            alerts,
            currentAlertIndex,
            currentAlert,
            isTransitioning,
            workflowKey,
            startWorkflow,
            nextAlert,
            skipAlert,
            exitWorkflow,
            markCurrentAsResolved,
            getTargetForPage
        }}>
            {children}
        </AlertWorkflowContext.Provider>
    );
}

export function useAlertWorkflow() {
    const context = useContext(AlertWorkflowContext);
    if (context === undefined) {
        throw new Error('useAlertWorkflow must be used within an AlertWorkflowProvider');
    }
    return context;
}
