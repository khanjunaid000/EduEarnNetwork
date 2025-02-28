import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import EducatorDashboard from "@/pages/educator-dashboard";
import StudentDashboard from "@/pages/student-dashboard";
import CoursePage from "@/pages/course-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute
        path="/educator"
        component={EducatorDashboard}
        roles={["educator", "admin"]}
      />
      <ProtectedRoute
        path="/student"
        component={StudentDashboard}
        roles={["student"]}
      />
      <ProtectedRoute path="/course/:id" component={CoursePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
