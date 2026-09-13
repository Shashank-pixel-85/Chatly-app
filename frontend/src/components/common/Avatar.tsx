import { initials } from "@/utils/format";
import clsx from "clsx";

interface AvatarProps {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg";
  status?: "online" | "offline";
  showStatus?: boolean;
}

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export function Avatar({ name, color, size = "md", status, showStatus = false }: AvatarProps) {
  return (
    <div className="relative shrink-0">
      <div
        className={clsx(
          "flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-white dark:ring-ink-900",
          sizeMap[size]
        )}
        style={{ backgroundColor: color }}
      >
        {initials(name)}
      </div>
      {showStatus && (
        <span
          className={clsx(
            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-ink-900",
            status === "online" ? "bg-emerald-500" : "bg-ink-300 dark:bg-ink-600"
          )}
        />
      )}
    </div>
  );
}
