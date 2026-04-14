import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface BreadcrumbSegment {
  label: string;
  path?: string;
}

interface AppBreadcrumbProps {
  segments: BreadcrumbSegment[];
}

export function AppBreadcrumb({ segments }: AppBreadcrumbProps) {
  const navigate = useNavigate();

  if (segments.length === 0) return null;

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            className="cursor-pointer flex items-center gap-1 hover:text-primary transition-colors"
            onClick={() => navigate("/dashboard")}
          >
            <Home className="h-3.5 w-3.5" />
            Dashboard
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          return (
            <span key={index} className="contents">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast || !segment.path ? (
                  <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => navigate(segment.path!)}
                  >
                    {segment.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
