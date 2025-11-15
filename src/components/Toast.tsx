import { useEffect } from "react";
import { CheckCircle, XCircle, Info, AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const toastConfig = {
  success: { icon: CheckCircle, bgColor: "bg-green-500/10", borderColor: "border-green-500/50", textColor: "text-green-400" },
  error: { icon: XCircle, bgColor: "bg-red-500/10", borderColor: "border-red-500/50", textColor: "text-red-400" },
  info: { icon: Info, bgColor: "bg-blue-500/10", borderColor: "border-blue-500/50", textColor: "text-blue-400" },
  warning: { icon: AlertCircle, bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/50", textColor: "text-yellow-400" },
};

export const Toast = ({ message, type = "info", duration = 3000, onClose }: ToastProps) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = toastConfig[type];
  const Icon = config.icon;

  return (
    <div className={`fixed top-4 right-4 z-50 ${config.bgColor} ${config.borderColor} border rounded-lg p-4 shadow-2xl backdrop-blur-sm max-w-md animate-slide-in-right`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${config.textColor} flex-shrink-0 mt-0.5`} />
        <p className={`${config.textColor} font-medium flex-1 text-sm`}>{message}</p>
        <button onClick={onClose} className={`${config.textColor} hover:opacity-70 transition-opacity flex-shrink-0`}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
