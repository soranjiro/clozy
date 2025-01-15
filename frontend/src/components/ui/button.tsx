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
    <button
      className={`btn ${isLoading ? "bg-gray-400" : "btn-primary"} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
};
