import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";

export default async function RegisterPage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="relative z-10 flex flex-col items-center gap-6">
      <RegisterForm />
      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
