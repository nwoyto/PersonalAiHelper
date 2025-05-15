
import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [_, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false
  });

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user]);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest("POST", "/api/auth/login", { 
        username: "admin", 
        password: "password" 
      });
      const data = await response.json();
      // Store the token in localStorage
      localStorage.setItem("token", data.token);
      // Force reload queries to update authentication state
      window.location.href = "/";
    } catch (error) {
      console.error("Login failed:", error);
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-surface rounded-lg shadow-lg">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-16 h-16 bg-primary rounded-full mb-4 flex items-center justify-center">
            <i className="ri-robot-2-line text-3xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-center">Welcome to Jibe AI</h1>
          <p className="text-center text-text-secondary">Your personal AI assistant</p>
        </div>
        
        {error && (
          <div className="p-3 text-sm bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <p className="text-center text-text-secondary font-medium">Demo Login</p>
          <p className="text-xs text-center text-text-secondary mb-4">
            Use these credentials to try out the app
          </p>
          <div className="flex items-center bg-surface-light px-3 py-2 rounded text-sm border">
            <span className="w-20 text-text-secondary">Username:</span>
            <span className="font-mono">admin</span>
          </div>
          <div className="flex items-center bg-surface-light px-3 py-2 rounded text-sm border">
            <span className="w-20 text-text-secondary">Password:</span>
            <span className="font-mono">password</span>
          </div>
        </div>
        
        <button 
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition flex items-center justify-center"
        >
          {isLoading ? (
            <span className="animate-spin mr-2">⟳</span>
          ) : (
            <i className="ri-login-circle-line mr-2"></i>
          )}
          {isLoading ? "Logging in..." : "Sign In"}
        </button>
      </div>
    </div>
  );
}
