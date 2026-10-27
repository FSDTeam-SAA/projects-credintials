/** Re-mounts on every navigation, so each page gets a soft entrance. */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in">{children}</div>;
}
