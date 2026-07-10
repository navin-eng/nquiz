"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { GraduationCap, LogIn, UserPlus } from "lucide-react";

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isLogin) {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid email or password");
        setLoading(false);
      } else {
        window.location.href = "/";
      }
    } else {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });

        if (res.ok) {
          // Auto login after registration
          await signIn("credentials", {
            redirect: false,
            email,
            password,
          });
          window.location.href = "/";
        } else {
          const data = await res.json();
          setError(data.message || "Registration failed");
          setLoading(false);
        }
      } catch {
        setError("An unexpected error occurred");
        setLoading(false);
      }
    }
  };

  return (
    <div className="glass-panel glass-card w-full max-w-md mx-auto mt-20 animate-fade-in">
      <div className="text-center mb-8">
        <div className="icon-btn mx-auto mb-4">
          <GraduationCap size={22} className="text-primary" />
        </div>
        <h1 className="heading-1 text-gradient">
          {isLogin ? "Welcome Back" : "Join nQuiz"}
        </h1>
        <p className="text-gray-400">
          {isLogin ? "Log in to continue your quiz streak." : "Create an account to start learning."}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-md mb-6 text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isLogin && (
          <div className="input-group">
            <label className="input-label">Name (Optional)</label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
        )}
        <div className="input-group">
          <label className="input-label">Email</label>
          <input
            type="email"
            required
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Password</label>
          <input
            type="password"
            required
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            minLength={6}
          />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary mt-4 w-full justify-center">
          {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
          {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-400">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
          }}
          className="text-primary hover:text-primary-hover font-semibold transition-colors bg-transparent border-none cursor-pointer"
        >
          {isLogin ? "Register" : "Log in"}
        </button>
      </div>
    </div>
  );
}
