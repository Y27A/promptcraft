import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Icon className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      {description && <p className={`text-sm text-muted-foreground${children ? " mb-4" : ""}`}>{description}</p>}
      {children}
    </div>
  );
}
