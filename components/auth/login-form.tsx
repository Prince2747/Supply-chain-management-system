"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { login } from "@/app/login/actions";
import { toast } from "sonner";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    
    // Show signing in toast
    const signingInToast = toast.loading("Signing in...", {
      description: "Authenticating your credentials"
    });
    
    startTransition(async () => {
      try {
        const result = await login(formData);
        
        if (result && result.success) {
          // Show success toast
          toast.success("Authentication successful!", {
            description: "Welcome back! Redirecting to your dashboard...",
            id: signingInToast,
            duration: 2000,
          });
          
          // Wait a moment for the toast to show, then redirect
          setTimeout(() => {
            router.push(result.redirectPath);
          }, 1500);
        } else {
          throw new Error("Authentication failed");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred during sign in";
        setError(errorMessage);
        toast.error("Sign in failed", {
          description: errorMessage,
          id: signingInToast,
          duration: 4000,
        });
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            required
            disabled={isPending}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            disabled={isPending}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Authenticating...
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      <div className="text-center pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <a
            href="mailto:admin@example.com"
            className="text-primary hover:underline"
          >
            Contact your administrator
          </a>
        </p>
      </div>
    </form>
  );
}
