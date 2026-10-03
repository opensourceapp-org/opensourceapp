import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchInputProps = React.ComponentProps<"input">;

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className={cn("relative", className)}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          ref={ref}
          type="search"
          className={cn(
            "flex h-11 w-full rounded-lg border border-input bg-surface pl-10 pr-3 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm",
          )}
          {...props}
        />
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";

export { SearchInput };
