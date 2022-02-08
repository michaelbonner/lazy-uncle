import React from "react";

const PrimaryButton = ({
  type = "button",
  children,
  disabled = false,
}: {
  disabled?: boolean;
  type?: "button" | "reset" | "submit" | undefined;
  children: React.ReactNode;
}) => {
  return (
    <button
      className="inline-flex items-center px-4 py-2 border border-transparent font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
};
export default PrimaryButton;
