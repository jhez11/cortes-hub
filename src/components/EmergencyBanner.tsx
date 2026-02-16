import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

interface EmergencyBannerProps {
  title: string;
  message: string;
  onDismiss?: () => void;
}

export const EmergencyBanner = ({ title, message, onDismiss }: EmergencyBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-emergency text-emergency-foreground px-4 py-3 animate-fade-in">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 animate-pulse-soft" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-sm opacity-90 line-clamp-2">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            onDismiss?.();
          }}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
