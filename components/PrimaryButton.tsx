import clsx from "clsx";
import { FC, ReactElement } from "react";

const PrimaryButton: FC<{
  children: ReactElement | string;
  disabled?: boolean;
  type?: "button" | "reset" | "submit" | undefined;
}> = ({ children, disabled = false, type = "button" }) => {
  return (
    <button
      className={clsx(
        "inline-flex items-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 font-medium text-white shadow-xs transition-opacity",
        "hover:bg-cyan-600",
        "focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:outline-hidden",
        disabled && "cursor-not-allowed opacity-50",
      )}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
};
export default PrimaryButton;
