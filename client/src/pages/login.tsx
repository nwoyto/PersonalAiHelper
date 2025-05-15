
import { useEffect } from "react";
import { useNavigate } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const navigate = useNavigate();
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false
  });

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-surface rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center">Welcome to Jibe AI</h1>
        <p className="text-center text-text-secondary">Please log in to continue</p>
        <button 
          onClick={() => apiRequest("POST", "/api/auth/login")}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition"
        >
          Login
        </button>
      </div>
    </div>
  );
}
