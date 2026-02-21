import React from 'react';
import { useAlert } from '../../contexts/AlertContext';
import './alerts.css';

export const AlertContainer: React.FC = () => {
  const { alerts, removeAlert } = useAlert();

  return (
    <div className="alert-container">
      {alerts.map((alert) => (
        <div key={alert.id} className={`alert alert-${alert.type}`}>
          <span>{alert.message}</span>
          <button
            className="alert-close"
            onClick={() => removeAlert(alert.id)}
            aria-label="Close alert"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
