import Link from "next/link";

export default function UltrasharkPageShell({
  title,
  description,
  children,
  actions,
  showDashboardLink = true,
  className = "",
}) {
  return (
    <main className={`mx-auto w-full max-w-5xl px-4 py-6 sm:py-8 ${className}`}>
      {title || description || actions || showDashboardLink ? (
        <div className="mb-6 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title ? (
              <h1 className="break-words text-2xl font-bold sm:text-3xl">
                {title}
              </h1>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-gray-600 sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
          {actions || showDashboardLink ? (
            <div className="flex shrink-0 flex-wrap gap-2">
              {actions}
              {showDashboardLink ? (
                <Link
                  href="/dashboard/ultrashark"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Dashboard
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="min-w-0">{children}</div>
    </main>
  );
}
