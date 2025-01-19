"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface AuthFormProps {
  type: "login" | "signup";
  onSubmit: (email: string, password: string, username?: string) => void;
}

export default function AuthForm({ type, onSubmit }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (type === "login") {
      onSubmit(email, password);
    } else {
      onSubmit(email, password, username);
    }
    setIsLoading(false);
  };

  return (
    <Card className="w-full">
      {/* <CardHeader>
        <CardTitle className="text-center text-brown text-2xl">
          {type === "login" ? "Login" : "Sign Up"}
        </CardTitle>
      </CardHeader> */}
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 flex flex-col justify-center items-center">
            <Label htmlFor="email" className="text-white">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-brown focus:border-brown focus:ring-brown"
            />
          </div>
          {type === "signup" && (
            <div className="space-y-2 flex flex-col justify-center items-center">
              <Label htmlFor="username" className="text-white">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="border-brown focus:border-brown focus:ring-brown"
              />
            </div>
          )}
          <div className="space-y-2 flex flex-col justify-center items-center">
            <Label htmlFor="password" className="text-white">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-brown focus:border-brown focus:ring-brown"
            />
          </div>
          <div className="flex justify-center">
            <Button
              type="submit"
              className="w-1/3 mx-auto bg-brown hover:bg-brown-dark text-cream"
              isLoading={isLoading}
            >
              {type === "login" ? "Login" : "Sign Up"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
