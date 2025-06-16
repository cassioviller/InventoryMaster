import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Header } from "@/components/layout/header";
import { Navigation } from "@/components/layout/navigation";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import MaterialEntry from "@/pages/material-entry";
import MaterialExit from "@/pages/material-exit";
import Management from "@/pages/management";
import Reports from "@/pages/reports";
import SuperAdmin from "@/pages/super-admin";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-bg">
      <Header />
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

function Router() {
  const { isLoading, isAuthenticated, isSuperAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? (
          isSuperAdmin ? <Redirect to="/super-admin" /> : <Redirect to="/" />
        ) : (
          <Login />
        )}
      </Route>
      
      <Route path="/super-admin">
        <ProtectedRoute>
          {isSuperAdmin ? <SuperAdmin /> : <Redirect to="/" />}
        </ProtectedRoute>
      </Route>
      
      <Route path="/">
        <ProtectedRoute>
          {isSuperAdmin ? (
            <Redirect to="/super-admin" />
          ) : (
            <AuthenticatedLayout>
              <Dashboard />
            </AuthenticatedLayout>
          )}
        </ProtectedRoute>
      </Route>
      
      <Route path="/material-entry">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <MaterialEntry />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/material-exit">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <MaterialExit />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/management">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Management />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/reports">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Reports />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      {/* Redirect to login if not authenticated */}
      <Route>
        {isAuthenticated ? (
          <AuthenticatedLayout>
            <NotFound />
          </AuthenticatedLayout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
