import React, { createContext, useCallback, useContext, useState } from 'react';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

export interface Alert {
  id: string;
  message: string;
  type: AlertType;
  duration?: number;
}

interface AlertContextType {
  alerts: Alert[];
  addAlert: (message: string, type: AlertType, duration?: number) => void;
  removeAlert: (id: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const addAlert = useCallback((message: string, type: AlertType, duration = 3000) => {
    const id = Date.now().toString();
    setAlerts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeAlert(id);
      }, duration);
    }
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  return (
    <AlertContext.Provider value={{ alerts, addAlert, removeAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
};
