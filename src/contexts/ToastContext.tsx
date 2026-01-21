import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Toast, type ToastType } from "../components/Toast";

interface ToastOptions {
    centered?: boolean;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
    const [toast, setToast] = useState<{ message: string; type: ToastType; centered: boolean; duration: number } | null>(null);

    const showToast = useCallback((message: string, type: ToastType = "info", options?: ToastOptions) => {
        setToast({
            message,
            type,
            centered: options?.centered ?? false,
            duration: options?.duration ?? 5000
        });
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    centered={toast.centered}
                    onClose={() => setToast(null)}
                />
            )}
        </ToastContext.Provider>
    );
};
