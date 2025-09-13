// components/ui/badge.tsx
import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success";
  className?: string;
  children: React.ReactNode;
}

export const Badge = ({ variant = "default", className, children }: BadgeProps) => {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  
  const variantClasses = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    destructive: "bg-red-100 text-red-800",
    outline: "border border-gray-300 bg-transparent text-gray-700",
    success: "bg-green-100 text-green-800",
  };

  return (
    <span className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </span>
  );
};

export default Badge;