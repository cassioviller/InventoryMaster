import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
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
import FinancialReport from "@/pages/financial-report";
import CostCenters from "@/pages/cost-centers";
import CostCenterReports from "@/pages/cost-center-reports";
import EmployeeReturn from "@/pages/employee-return";
import ThirdPartyReturn from "@/pages/third-party-return";
import SuperAdminPanel from "@/pages/super-admin-panel";
import MovementsManagement from "@/pages/movements-management";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-bg dark:bg-gray-900 transition-colors">
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
        {isAuthenticated ? <Redirect to="/" /> : <Login />}
      </Route>
      
      <Route path="/super-admin">
        <ProtectedRoute requireAdmin>
          <AuthenticatedLayout>
            <SuperAdminPanel />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Dashboard />
          </AuthenticatedLayout>
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
      
      <Route path="/financial-reports">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <FinancialReport />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/cost-centers">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <CostCenters />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/cost-center-reports">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <CostCenterReports />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/employee-return">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <EmployeeReturn />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/third-party-return">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <ThirdPartyReturn />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/financial-report">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <FinancialReport />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/movements-management">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <MovementsManagement />
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
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
