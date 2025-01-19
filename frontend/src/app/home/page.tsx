"use client";

import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserContext } from "@/context/UserContext";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";

export default function Page() {
  const { user } = useContext(UserContext);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  return (
    <>
      <Header title="Home" />
      <div className="min-h-screen bg-wood">
        {user ? (
          <div className="container mx-auto py-8">
            <h1 className="text-3xl text-white font-bold text-center">
              Home
            </h1>
            {user && (
              <p className="text-3xl text-white text-center mt-4">
                Welcome, {user.username}!
              </p>
            )}
            <div className="mt-8 space-y-4 text-center">
              <Button
                type="button"
                onClick={() => router.push("/clothes")}
                className="hover:bg-brown-dark"
              >
                Clothes List
              </Button>
              <Button
                type="button"
                onClick={() => router.push("/addClothes")}
                className="hover:bg-brown-dark"
              >
                Add Clothes
              </Button>
              <Button
                type="button"
                onClick={() => router.push("/calendar")}
                className="hover:bg-brown-dark"
              >
                Calendar
              </Button>
              <Button
                type="button"
                onClick={() => router.push("/statics")}
                className="hover:bg-brown-dark"
              >
                Statics
              </Button>
              <Button
                type="button"
                onClick={() => router.push("/account")}
                className="hover:bg-brown-dark"
              >
                Account
              </Button>
            </div>
          </div>
        ) : (
          <div>ログインしてください</div>
        )}
      </div>
    </>
  );
}
