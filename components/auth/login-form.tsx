"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { login } from "@/app/[locale]/login/actions";
import { toast } from "sonner";
import { useTranslations } from 'next-intl';

export function LoginForm() {
  const t = useTranslations('loginForm');
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const locale = useLocale();

  const handleSubmit = async (formData: FormData) => {
    setError(null);

    const email = (formData.get('email') || '').toString().trim();
    const password = (formData.get('password') || '').toString();

    if (!email) {
      const message = t('emailRequired');
      setError(message);
      toast.error(message);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const message = t('emailInvalid');
      setError(message);
      toast.error(message);
      return;
    }

    if (!password) {
      const message = t('passwordRequired');
      setError(message);
      toast.error(message);
      return;
    }
    
    // Show signing in toast
    const signingInToast = toast.loading(t('signingIn'), {
      description: t('authenticating')
    });
    
    startTransition(async () => {
      try {
        const result = await login(formData);
        
        if (result && result.success) {
          // Show success toast
          toast.success(t('authSuccess'), {
            description: t('welcome'),
            id: signingInToast,
            duration: 2000,
          });
          
          // Wait a moment for the toast to show, then redirect
          setTimeout(() => {
            // Add locale prefix to the redirect path
            const localizedPath = `/${locale}${result.redirectPath}`;

            // In dev (especially Codespaces), Next chunks can go stale and throw ChunkLoadError
            // during client-side transitions. Recover by hard reloading to the destination.
            const onUnhandledRejection = (event: PromiseRejectionEvent) => {
              const reason = event.reason as any;
              const message = String(reason?.message ?? reason ?? '');
              const name = String(reason?.name ?? '');
              if (name === 'ChunkLoadError' || /ChunkLoadError|Loading chunk \d+ failed/i.test(message)) {
                window.removeEventListener('unhandledrejection', onUnhandledRejection);
                window.location.href = localizedPath;
              }
            };
            window.addEventListener('unhandledrejection', onUnhandledRejection);

            // Best-effort cleanup in case nothing errors.
            window.setTimeout(() => {
              window.removeEventListener('unhandledrejection', onUnhandledRejection);
            }, 10_000);

            router.push(localizedPath);
          }, 1500);
        } else {
          throw new Error("Authentication failed");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('error');
        setError(errorMessage);
        toast.error(t('signInFailed'), {
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
        <Label htmlFor="email">{t('email')}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={t('emailPlaceholder')}
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t('password')}</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder={t('passwordPlaceholder')}
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

      <div className="text-right">
        <Link
          href={`/${locale}/reset-password`}
          className="text-sm text-primary hover:underline"
        >
          {t('forgotPassword')}
        </Link>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('authenticatingButton')}
          </>
        ) : (
          t('signIn')
        )}
      </Button>

      <div className="text-center pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          {t('noAccount')}{" "}
          <a
            href="mailto:admin@example.com"
            className="text-primary hover:underline"
          >
            {t('contactAdmin')}
          </a>
        </p>
      </div>
    </form>
  );
}
