import { Spinner } from "@/components/common/States";
import BrandMark from "./BrandMark";

/** Full-screen loader shown while the saved session is checked, before either the panel or the login page. */
export default function SplashScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6" role="status" aria-label="Ачаалж байна">
      <BrandMark />
      <Spinner />
    </div>
  );
}
