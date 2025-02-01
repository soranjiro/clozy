import React from "react";
import LoadingScreen from "@/components/ui/loadingScreen";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  isLoading?: boolean;
  isDisabled?: boolean; // 新しいプロパティを追加
}

export const Button: React.FC<ButtonProps> = ({
  className = "",
  children,
  isLoading,
  isDisabled, // 新しいプロパティを追加
  ...props
}) => {
  return (
    <>
      {isLoading && (
        <LoadingScreen />
      )}
      <button
        className={`btn ${isLoading || isDisabled ? "bg-gray-400" : "btn-primary"} ${className}`}
        disabled={isLoading || isDisabled} // isDisabledも考慮
        {...props}
      >
        {isLoading ? "Loading..." : children}
      </button>
    </>
  );
};
