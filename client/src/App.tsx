import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import Home from "@/pages/home";
import Tasks from "@/pages/tasks";
import Notes from "@/pages/notes";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function App() {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Layout 
          isVoiceModalOpen={isVoiceModalOpen} 
          setIsVoiceModalOpen={setIsVoiceModalOpen}
        >
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/tasks" component={Tasks} />
            <Route path="/notes" component={Notes} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
