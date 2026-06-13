import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";

export default async function LoginPage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Left: Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden bg-gradient-to-br from-primary/20 via-primary/5 to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />
        <div className="absolute top-1/4 -left-16 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-16 w-96 h-96 bg-primary-fixed-dim/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-lg">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-fixed-dim flex items-center justify-center shadow-2xl mb-8">
            <span className="material-icon text-[40px] text-white">auto_awesome</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">CognitiveSync AI</h2>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            Your intelligent workspace for documents, research, and knowledge management powered by AI.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 w-full">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-icon text-primary">description</span>
              </div>
              <span className="text-xs text-on-surface-variant">Documents</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-icon text-primary">chat</span>
              </div>
              <span className="text-xs text-on-surface-variant">Chat</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-icon text-primary">quiz</span>
              </div>
              <span className="text-xs text-on-surface-variant">Quizzes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-fixed-dim flex items-center justify-center">
              <span className="material-icon text-[22px] text-white">auto_awesome</span>
            </div>
            <span className="text-lg font-bold text-foreground">CognitiveSync AI</span>
          </div>
          <LoginForm />
          <p className="text-sm text-muted-foreground text-center mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary underline-offset-4 hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
