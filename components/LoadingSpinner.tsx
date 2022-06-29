import React from "react";

const LoadingSpinner = ({
  spinnerTextColor = "text-cyan-50",
}: {
  spinnerTextColor?: string;
}) => {
  return (
    <div className="circle w-16 h-16 mx-auto">
      <svg
        className="circle__svg"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className={`circle__svg-circle fill-transparent stroke-current ${spinnerTextColor}`}
          cx="50"
          cy="50"
          r="45"
        />
      </svg>
    </div>
  );
};
export default LoadingSpinner;
