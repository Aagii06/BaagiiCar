/** Static export: build one HTML shell for the placeholder id "_"; nginx serves it for every id. */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
