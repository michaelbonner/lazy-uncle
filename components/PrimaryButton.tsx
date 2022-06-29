import { FC, ReactElement } from "react";

const PrimaryButton: FC<{
  children: ReactElement | string;
  disabled?: boolean;
  type?: "button" | "reset" | "submit" | undefined;
}> = ({ type = "button", children, disabled = false }) => {
  return (
    <button
      className="inline-flex items-center px-4 py-2 border border-transparent font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
};
export default PrimaryButton;
