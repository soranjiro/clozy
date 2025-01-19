import React from "react";
import LoadingScreen from "@/components/ui/loading";

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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 pointer-events-auto mt-20"
        >
          <LoadingScreen />
        </div>
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
