import React from "react";
import { Button } from "@/components/ui/button";

interface ErrorRetryProps {
  errorMessage: string;
  onRetry: () => void;
  className?: string;
}

const ErrorRetry: React.FC<ErrorRetryProps> = ({
  errorMessage,
  onRetry,
  className = "w-2/3",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-6 bg-red-50 border border-red-300 rounded-md my-8 mx-auto ${className}`}
    >
      <p className="text-red-600 mb-4">エラーが発生しました: {errorMessage}</p>
      <Button
        type="button"
        onClick={onRetry}
        className="bg-red-600 hover:bg-red-700"
      >
        再試行
      </Button>
    </div>
  );
};

export default ErrorRetry;
