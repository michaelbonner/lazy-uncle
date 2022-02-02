import React from "react";

const PrimaryButton = ({
  type = "button",
  children,
}: {
  type?: "button" | "reset" | "submit" | undefined;
  children: React.ReactNode;
}) => {
  return (
    <button
      className="inline-flex items-center px-4 py-2 border border-transparent font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      type={type}
    >
      {children}
    </button>
  );
};
export default PrimaryButton;
