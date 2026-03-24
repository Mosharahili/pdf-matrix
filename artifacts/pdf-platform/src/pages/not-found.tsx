import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function NotFound() {
  return (
    <>
      <SEO title="404 - Page Not Found" />
      <div className="min-h-[70vh] w-full flex items-center justify-center px-4">
        <div className="bg-card p-8 sm:p-12 rounded-3xl shadow-xl shadow-black/5 border border-border text-center max-w-md w-full">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">404</h1>
          <p className="text-lg text-muted-foreground mb-8">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link href="/" className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary-hover transition-colors w-full sm:w-auto">
            Return to Homepage
          </Link>
        </div>
      </div>
    </>
  );
}
