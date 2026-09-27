import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AppCardProps = {
  slug: string;
  name: string;
  tagline?: string | null;
  primaryLanguage?: string | null;
  stars?: number | null;
  categories?: { category: { name: string } }[];
};

export function AppCard({
  slug,
  name,
  tagline,
  primaryLanguage,
  stars,
  categories = [],
}: AppCardProps) {
  return (
    <Link href={`/apps/${slug}`} className="block h-full">
      <Card className="h-full transition-colors hover:border-foreground/20">
        <CardHeader>
          <CardTitle className="text-lg">{name}</CardTitle>
          {tagline && <CardDescription>{tagline}</CardDescription>}
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {primaryLanguage && <Badge variant="outline">{primaryLanguage}</Badge>}
          {typeof stars === "number" && (
            <Badge variant="outline">{stars.toLocaleString()} stars</Badge>
          )}
          {categories.slice(0, 2).map((c) => (
            <Badge key={c.category.name} variant="secondary">
              {c.category.name}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </Link>
  );
}
