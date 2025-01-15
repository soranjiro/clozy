import React from "react";

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 pointer-events-auto"
        >
          <div className="border-4 border-gray-200 border-t-blue-500 rounded-full w-12 h-12 animate-spin" />
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
