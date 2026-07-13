import { clsx } from "clsx";

export function BrandLogo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={clsx("flex items-center gap-3", className)}>
      <img
        alt="Enjoy Learning English logo"
        className="h-11 w-11 rounded-lg object-contain"
        src="/brand/logo.png"
      />
      {!compact ? (
        <div className="min-w-0">
          <p className="truncate font-bold text-ink">Enjoy Learning English</p>
          <p className="text-xs font-medium text-slate-500">
            Learn with confidence
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function BrandBanner({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-r from-white via-blue-50 to-amber-50 p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wide text-coral">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
        <div className="shrink-0 rounded-xl bg-white/80 p-3 shadow-sm">
          <BrandLogo compact />
        </div>
      </div>
    </section>
  );
}
