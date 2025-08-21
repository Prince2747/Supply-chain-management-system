"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Leaf, MapPin, Mail, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <div className="bg-secondary text-secondary-foreground py-2 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>
                  Churchill Avenue, Eshetu Mamo Building - F8 Office 801
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span>info@azmerawbekele.com</span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-secondary-foreground text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary bg-transparent"
            >
              Request a Quote
            </Button>
          </div>
        </div>
      </div>

      <nav className="bg-background border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <img src="/logo.png" alt="Company Logo" className="h-8 w-auto" />
              <span className="font-serif font-bold text-xl text-foreground">
                Azmeraw Bekele Import & Export
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <nav className="flex items-center space-x-6">
                <Link
                  href="/"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/about"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  About Us
                </Link>
              </nav>
              <Link href="/login">
                <Button size="sm">Login</Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-border bg-background">
              <div className="px-4 py-2 space-y-1">
                <Link
                  href="/"
                  className="block px-3 py-2 text-foreground hover:text-primary hover:bg-accent rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/about"
                  className="block px-3 py-2 text-foreground hover:text-primary hover:bg-accent rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About Us
                </Link>
                <div className="pt-2 border-t border-border">
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button size="sm" className="w-full">
                      Login
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
