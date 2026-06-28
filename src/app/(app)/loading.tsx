import { Card } from "@/components/ui";

export default function Loading() {
  return (
    <div className="grid gap-4">
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
      <Card>
        <div className="grid gap-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
          <div className="h-24 animate-pulse rounded bg-slate-100" />
        </div>
      </Card>
    </div>
  );
}
