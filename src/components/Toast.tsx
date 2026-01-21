import { useEffect } from "react";
import { CheckCircle, XCircle, Info, AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  centered?: boolean;
}

const toastConfig = {
  success: { icon: CheckCircle, bgColor: "bg-green-500/10", borderColor: "border-green-500/50", textColor: "text-green-400" },
  error: { icon: XCircle, bgColor: "bg-red-500/10", borderColor: "border-red-500/50", textColor: "text-red-400" },
  info: { icon: Info, bgColor: "bg-blue-500/10", borderColor: "border-blue-500/50", textColor: "text-blue-400" },
  warning: { icon: AlertCircle, bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/50", textColor: "text-yellow-400" },
};

export const Toast = ({ message, type = "info", duration = 3000, onClose, centered = false }: ToastProps) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = toastConfig[type];
  const Icon = config.icon;

  const positionClasses = centered
    ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    : "fixed top-4 right-4";

  const sizeClasses = centered
    ? "w-[90vw] sm:w-[450px] md:w-[500px] max-w-[600px]"
    : "max-w-md w-full sm:w-auto";

  return (
    <>
      {/* Backdrop overlay for centered toasts */}
      {centered && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      )}

      <div className={`${positionClasses} ${sizeClasses} z-50 ${config.bgColor} ${config.borderColor} border-2 rounded-xl p-4 sm:p-6 shadow-2xl backdrop-blur-sm ${centered ? '' : 'animate-slide-in-right mx-4'}`}>
        <div className="flex items-start gap-3 sm:gap-4">
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${config.textColor} flex-shrink-0 mt-0.5`} />
          <p className={`${config.textColor} font-semibold flex-1 text-sm sm:text-base leading-relaxed`}>{message}</p>
          <button
            onClick={onClose}
            className={`${config.textColor} hover:opacity-70 transition-opacity flex-shrink-0 p-1`}
            aria-label="Close notification"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </>
  );
};
