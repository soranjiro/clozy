import React from "react";
import Loading from "@/components/ui/loading";

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40 pointer-events-auto">
      <Loading />
    </div>
  );
};

export default LoadingScreen;
