import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar, Newspaper, Menu, X, Building2 } from "lucide-react";
import { useState } from "react";

export function Navigation() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const navItems = [
    { href: "/", label: "新闻", icon: Newspaper },
    { href: "/events", label: "AI行业会议", icon: Calendar },
    { href: "/companies", label: "AI公司目录", icon: Building2 },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-slate-800 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white hover:opacity-80 transition-opacity">
              <Newspaper className="w-6 h-6 text-blue-600" />
              <span>AI Daily News</span>
            </a>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <a>
                  <Button
                    variant={isActive(href) ? "default" : "ghost"}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Button>
                </a>
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-slate-700 py-2">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <a
                  className="block"
                  onClick={() => setIsOpen(false)}
                >
                  <Button
                    variant={isActive(href) ? "default" : "ghost"}
                    className="w-full justify-start flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Button>
                </a>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
