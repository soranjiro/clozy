"use client";

import { useEffect, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { changePassword, signOut } from "@/api/user";
import { UserContext } from "@/context/UserContext";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";

const Account = () => {
  const router = useRouter();
  const { user, setUser, userLogout } = useContext(UserContext);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      userLogout();
    }
  }, [user, router, userLogout]);

  const handlePasswordChange = async () => {
    if (!user) return;
    try {
      await changePassword(user.email, password, newPassword);
      alert("Password has been changed");
      setShowPasswordChange(false);
    } catch (error) {
      alert(error);
    }
  };

  const handleSignOut = async () => {
    if (!user) return;
    const confirmSignOut = window.confirm(
      "All user data will be deleted.\nAre you sure you want to proceed?"
    );
    if (!confirmSignOut) return;

    try {
      await signOut(user.email);
      setUser(null);
      router.push("/login");
    } catch (error) {
      alert("Error signing out:" + error);
    }
  };

  return (
    <>
      <Header title="Account" />
      <div className="p-4 bg-wood min-h-screen flex justify-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-4">
            Account Information
          </h1>
          {user && (
            <>
              <p className="text-lg text-white mb-2">
                Username: {user.username}
              </p>
              <p className="text-lg text-white mb-4">メール: {user.email}</p>
              <Button
                type="button"
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className=""
              >
                {showPasswordChange ? "Cancel" : "Change Password"}
              </Button>
              {showPasswordChange && (
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Current Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border border-gray-300 p-2 rounded w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <FaEye /> : <FaEyeSlash />}
                    </button>
                  </div>
                  <div className="flex items-center mb-4">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="border border-gray-300 p-2 rounded w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <FaEye /> : <FaEyeSlash />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    onClick={handlePasswordChange}
                    className="bg-blue-500 hover:bg-blue-700 text-white"
                  >
                    Save
                  </Button>
                </div>
              )}
              <Button
                type="button"
                onClick={handleSignOut}
                className="btn-danger"
              >
                Delete Account
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Account;
