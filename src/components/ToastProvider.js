"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Check, CircleAlert, X } from "lucide-react";

const ToastContext = createContext(null);

export function useToast() {
  const notify = useContext(ToastContext);
  if (!notify) throw new Error("useToast must be used within ToastProvider.");
  return notify;
}

export default function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  const dismiss = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setToast(null);
  }, []);

  const notify = useCallback((message, type = "success") => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setToast({ message, type, id: Date.now() });
    timeoutRef.current = window.setTimeout(() => setToast(null), 6000);
  }, []);

  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-stack" aria-live={toast?.type === "error" ? "assertive" : "polite"} aria-atomic="true">
        {toast && (
          <div key={toast.id} className={`app-toast app-toast--${toast.type}`} role={toast.type === "error" ? "alert" : "status"}>
            {toast.type === "error" ? <CircleAlert size={18} aria-hidden="true" /> : <Check size={18} aria-hidden="true" />}
            <span>{toast.message}</span>
            <button type="button" onClick={dismiss} aria-label="Dismiss notification"><X size={16} /></button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
