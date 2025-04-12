import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, UserPlus, LogIn } from "lucide-react";

import { authApi } from "../lib/api";

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        console.log("Logging in with:", { email, password });
        const res = await authApi.login(email, password); // Await the login API call
        console.log("Login successful:", res);
      } else {
        console.log("Registering with:", { name, email, password });
        const res = await authApi.signup(email, name, password); // Await the signup API call
        console.log("Signup successful:", res);
      }
      onLogin(true); // Call the onLogin callback after successful authentication
    } catch (error) {
      console.error(
        "Authentication failed:",
        error.response?.data || error.message
      );
      alert("Authentication failed. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin
              ? "Sign in to access your account"
              : "Sign up to get started with our app"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <div className="mt-1 flex items-center rounded-md border border-gray-300 shadow-sm">
                <span className="pl-3 text-gray-500">
                  <UserPlus size={18} />
                </span>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required={!isLogin}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-md border-0 py-3 pl-2 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <div className="mt-1 flex items-center rounded-md border border-gray-300 shadow-sm">
              <span className="pl-3 text-gray-500">
                <Mail size={18} />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border-0 py-3 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="mt-1 flex items-center rounded-md border border-gray-300 shadow-sm">
              <span className="pl-3 text-gray-500">
                <Lock size={18} />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-0 py-3 pl-2 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                // placeholder="••••••••"
                placeholder="Super secure password here!"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="pr-3 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isLogin && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-md bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLogin ? (
              <>
                <LogIn size={18} className="mr-2" />
                Sign In
              </>
            ) : (
              <>
                <UserPlus size={18} className="mr-2" />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 font-medium text-blue-600 hover:text-blue-800"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
