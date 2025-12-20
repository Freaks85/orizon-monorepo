"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

type Employee = {
    id: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'manager' | 'staff';
    pin_code?: string;
    manager_id: string;
};

type EmployeeContextType = {
    activeEmployee: Employee | null;
    setActiveEmployee: (employee: Employee | null) => void;
};

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export function EmployeeProvider({ children }: { children: ReactNode }) {
    const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null);

    return (
        <EmployeeContext.Provider value={{ activeEmployee, setActiveEmployee }}>
            {children}
        </EmployeeContext.Provider>
    );
}

export function useEmployee() {
    const context = useContext(EmployeeContext);
    if (context === undefined) {
        throw new Error('useEmployee must be used within an EmployeeProvider');
    }
    return context;
}
