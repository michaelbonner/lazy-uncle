import { FC, ReactElement } from "react";

const PrimaryButton: FC<{
  children: ReactElement | string;
  disabled?: boolean;
  type?: "button" | "reset" | "submit" | undefined;
}> = ({ type = "button", children, disabled = false }) => {
  return (
    <button
      className="inline-flex items-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
};
export default PrimaryButton;
