import React from "react";
import LoadingScreen from "@/components/ui/loadingScreen";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  className = "",
  children,
  isLoading,
  ...props
}) => {
  return (
    <>
      {isLoading && (
        <LoadingScreen />
      )}
      <button
        className={`btn ${isLoading ? "bg-gray-400" : "btn-primary"} ${className}`}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? "Loading..." : children}
      </button>
    </>
  );
};
