"use client";

// import { useContext } from "react";
// import { useRouter } from "next/navigation";
import Link from "next/link";
// import AuthForm from "@/components/AuthForm";
import Header from "@/components/header";
// import { UserContext } from "@/context/UserContext";
// import { signup } from "@/api/user";

export default function SignupPage() {
  // const router = useRouter();
  // const { setUser } = useContext(UserContext);

  // const handleSignup = async (email: string, password: string, username?: string) => {
  //   if (!username) {
  //     alert("Username is required");
  //     return;
  //   }
  //   try {
  //     const response = await signup(email, username, password);
  //     setUser({ username: response.username, email });
  //     router.push('/home');
  //   } catch (error) {
  //     alert("Signup failed", error);
  //   }
  // };

  return (
    <>
      <Header title="Signup" />
      <div className="space-y-4">
        {/* <AuthForm type="signup" onSubmit={handleSignup} /> */}
        <p className="justify-center text-center text-white font-bold mt-10 text-lg">
          Account registration is currently suspended.
          <br />
          If you wish to use the service, please contact the administrator.
        </p>
        <p className="justify-center text-center text-white text-lg">
          If you already have an account,
          <Link
            href="/login"
            className="flex justify-center items-center text-amber-500 font-bold hover:underline"
          >
            log in here
          </Link>
        </p>
      </div>
    </>
  );
}
