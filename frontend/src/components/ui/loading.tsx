import React from "react";

const Loading: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="border-4 border-gray-200 border-t-blue-500 rounded-full w-12 h-12 animate-spin" />
    </div>
  );
};

export default Loading;
