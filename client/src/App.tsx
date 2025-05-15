import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import Home from "@/pages/home";
import Tasks from "@/pages/tasks";
import Notes from "@/pages/notes";
import Calendar from "@/pages/calendar";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import { useQuery } from "@tanstack/react-query";

function App() {
  const [location, navigate] = useLocation();
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false
  });

  useEffect(() => {
    if (!isLoading && !user && location !== "/login") {
      navigate("/login");
    }
  }, [user, isLoading, location]);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  return (
    <TooltipProvider>
      <Layout 
        isVoiceModalOpen={isVoiceModalOpen} 
        setIsVoiceModalOpen={setIsVoiceModalOpen}
      >
        <Switch>
          <Route path="/login" component={Login} />
          {user ? (
            <>
              <Route path="/" component={Home} />
              <Route path="/tasks" component={Tasks} />
              <Route path="/notes" component={Notes} />
              <Route path="/calendar" component={Calendar} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </>
          ) : null}
        </Switch>
      </Layout>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
