import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import Album from "@/pages/Album";
import PhotoView from "@/pages/PhotoView";
import Settings from "@/pages/Settings";
import GitHubSetup from "@/pages/GitHubSetup";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  
  // Routes that don't use the Layout (full-screen experiences)
  const noLayoutRoutes = ['/photo/', '/github-setup'];
  const shouldUseLayout = !noLayoutRoutes.some(route => location.startsWith(route)) && location !== '/';
  
  if (shouldUseLayout) {
    return (
      <Layout>
        <Switch>
          <Route path="/album" component={Album} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    );
  }
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/photo/:id" component={PhotoView} />
      <Route path="/github-setup" component={GitHubSetup} />
      <Route path="/album" component={Album} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
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
