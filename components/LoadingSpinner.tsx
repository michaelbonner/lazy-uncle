const LoadingSpinner = ({
  spinnerTextColor = "text-cyan-50",
  size = "default",
}: {
  spinnerTextColor?: string;
  size?: "sm" | "default";
}) => {
  const sizeClasses = size === "sm" ? "h-4 w-4" : "h-16 w-16";
  const containerClasses = size === "sm" ? "circle" : "circle mx-auto";

  return (
    <div
      className={`${containerClasses} ${sizeClasses}`}
      data-testid="loading-spinner"
    >
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
