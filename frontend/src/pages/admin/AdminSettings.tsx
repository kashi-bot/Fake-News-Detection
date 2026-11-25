export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Platform Settings</h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-500">
          Settings are managed via environment variables. Edit <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">.env</code> and restart.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Setting label="AI Provider" value="groq" />
          <Setting label="AI Model" value="qwen/qwen3.8-27b" />
          <Setting label="News Providers" value="googlenews, mock" />
          <Setting label="OCR Provider" value="tesseract" />
          <Setting label="Max Upload" value="10 MB" />
          <Setting label="Verify Cache TTL" value="900 s" />
        </div>
      </div>
    </div>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 font-mono text-xs">{value}</p>
    </div>
  );
}