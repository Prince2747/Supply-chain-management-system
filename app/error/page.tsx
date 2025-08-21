"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Home, RefreshCw, Database } from "lucide-react";

export default function ErrorPage() {
  const router = useRouter();
  const [timestamp, setTimestamp] = useState<string>(""); // Initialize empty to avoid SSR rendering
  const [errorType, setErrorType] = useState<string>("general");

  // Generate timestamp and get error type from URL
  useEffect(() => {
    setTimestamp(new Date().toLocaleString());
    const urlParams = new URLSearchParams(window.location.search);
    setErrorType(urlParams.get("type") || "general");
  }, []);

  const handleGoHome = () => {
    router.push("/");
  };

  const handleRefresh = () => {
    // Add a small delay to prevent rapid redirect loops
    setTimeout(() => {
      if (errorType === "database") {
        // For database errors, try to go back to the admin dashboard
        router.push("/admin");
      } else {
        // For other errors, reload the page
        window.location.reload();
      }
    }, 500); // 500ms delay
  };

  const getErrorContent = () => {
    switch (errorType) {
      case "database":
        return {
          icon: Database,
          title: "Database Connection Error",
          description:
            "Unable to connect to the database. This might be due to network issues or the database being temporarily unavailable.",
          suggestions: [
            "Check your internet connection",
            "The database server might be temporarily down or paused",
            "If using Supabase, check if your project is paused in the dashboard",
            "Wait a few moments and try again",
            "Contact support if the issue persists",
          ],
          buttonText: "Return to Dashboard",
        };
      default:
        return {
          icon: AlertTriangle,
          title: "System Error",
          description:
            "An unexpected error occurred while processing your request.",
          suggestions: [
            "Try refreshing the page",
            "Check your internet connection",
            "Clear your browser cache",
            "Contact support if the issue persists",
          ],
          buttonText: "Try Again",
        };
    }
  };

  const errorContent = getErrorContent();
  const IconComponent = errorContent.icon;

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 flex items-center justify-center py-12 bg-gradient-to-br from-destructive/5 to-muted/10">
        <div className="w-full max-w-md px-4">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <IconComponent className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="font-serif text-2xl text-destructive">
                {errorContent.title}
              </CardTitle>
              <CardDescription>{errorContent.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  This could be due to:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 text-left">
                  {errorContent.suggestions.map((suggestion, index) => (
                    <li key={index}>• {suggestion}</li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={handleRefresh} className="w-full" size="lg">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {errorContent.buttonText}
                </Button>
                <Button
                  onClick={handleGoHome}
                  variant="outline"
                  className="w-full bg-transparent"
                  size="lg"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Return to Login
                </Button>
              </div>

              <div className="text-center pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  If the problem persists, please contact your system
                  administrator or{" "}
                  <a
                    href="mailto:info@azmerawbekele.com"
                    className="text-primary hover:underline"
                  >
                    technical support
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Error Code Information */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="font-serif text-lg">
                Error Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Error Code:</span>
                  <span className="font-mono">SCMS-500</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timestamp:</span>
                  <span className="font-mono">{timestamp || "Loading..."}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">System:</span>
                  <span>Supply Chain Management</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
