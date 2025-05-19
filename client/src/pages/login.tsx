
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

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest("POST", "/api/auth/login", { 
        username, 
        password 
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

        {/* Social Login Buttons */}
        <div className="space-y-3">
          <p className="text-center text-text-secondary font-medium">Sign in with</p>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Google Sign In */}
            <button 
              onClick={() => window.location.href = '/api/login'}
              className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#FFC107"/>
                <path d="M3.15302 7.3455L6.43852 9.755C7.32752 7.554 9.48052 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.15902 2 4.82802 4.1685 3.15302 7.3455Z" fill="#FF3D00"/>
                <path d="M12 22C14.583 22 16.93 21.0115 18.7045 19.404L15.6095 16.785C14.5718 17.5742 13.3038 18.001 12 18C9.39897 18 7.19047 16.3415 6.35847 14.027L3.09747 16.5395C4.75247 19.778 8.11347 22 12 22Z" fill="#4CAF50"/>
                <path d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.7845L18.7045 19.4035C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#1976D2"/>
              </svg>
              Google
            </button>
            
            {/* Microsoft Sign In */}
            <button 
              className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 transition-colors opacity-60"
              disabled
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.4 24H0V12.6H11.4V24Z" fill="#F1511B"/>
                <path d="M24 24H12.6V12.6H24V24Z" fill="#80CC28"/>
                <path d="M11.4 11.4H0V0H11.4V11.4Z" fill="#00ADEF"/>
                <path d="M24 11.4H12.6V0H24V11.4Z" fill="#FBBC09"/>
              </svg>
              Microsoft
            </button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface text-gray-500">Or</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <p className="text-center text-text-secondary font-medium">Login</p>
          
          <div className="space-y-1">
            <label htmlFor="username" className="block text-sm font-medium">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Enter username"
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Enter password"
            />
          </div>
          
          <div className="text-xs text-center text-text-secondary bg-surface-light p-2 rounded">
            <p className="font-medium">Demo Credentials</p>
            <p>Username: admin | Password: password</p>
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
