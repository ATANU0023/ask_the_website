import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function WorkspaceLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
