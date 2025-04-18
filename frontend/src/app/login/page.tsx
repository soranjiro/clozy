"use client";

import { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import Header from "@/components/header";
import { login } from "@/api/user";
import { UserContext } from "@/context/UserContext";
import { FaGithub } from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useContext(UserContext);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await login(email, password);
      setUser({ username: response.username, email });
      router.push("/home");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "The email address or password is incorrect") {
          setErrorMessage("The email address or password is incorrect");
        } else {
          setErrorMessage("Login failed: " + error.message);
        }
      } else {
        setErrorMessage("Login failed");
      }
    }
  };

  const handleDemoLogin = async () => {
    setErrorMessage(null);
    const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD;
    if (!demoPassword) {
      setErrorMessage("Demo password is not configured.");
      return;
    }
    await handleLogin("demo@example.com", demoPassword);
  };

  return (
    <>
      <Header title="Login" />
      <div className="space-y-4">
        {errorMessage && (
          <p className="text-red-500 text-center font-bold">{errorMessage}</p>
        )}
        <AuthForm type="login" onSubmit={handleLogin} />
        <p className="justify-center text-center text-white">
          Don&apos;t have an account?
          <br />
          <button
            type="button"
            onClick={handleDemoLogin}
            className="bg-green-600 hover:bg-green-700 text-white font-bold my-2 py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Try with Demo Account
          </button>
          <Link
            href="/signup"
            className="flex justify-center items-center text-amber-500 font-bold hover:underline"
          >
            Sign up here
          </Link>
        </p>
        <p className="justify-center text-center text-white">
          Documentation is{" "}
          <Link
            href="https://github.com/soranjiro/clozy/blob/main/docs/HowToUse/README.md"
            className="text-amber-500 font-bold hover:underline inline-block"
          >
            here
          </Link>
        </p>
        <p className="flex justify-center text-center text-amber-600 hover:text-amber-700">
          <a
            href="https://github.com/soranjiro/clozy"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub Repository"
          >
            <FaGithub size={30} />
          </a>
        </p>
      </div>
    </>
  );
}
