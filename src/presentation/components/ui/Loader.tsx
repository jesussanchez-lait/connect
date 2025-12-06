interface LoaderProps {
  size?: "sm" | "md" | "lg";
  color?: "white" | "blue" | "gray";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-8 w-8",
};

const colorClasses = {
  white: "text-white",
  blue: "text-blue-600",
  gray: "text-gray-600",
};

export function Loader({
  size = "md",
  color = "blue",
  className = "",
}: LoaderProps) {
  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

interface LoaderWithTextProps extends LoaderProps {
  text: string;
  textClassName?: string;
}

export function LoaderWithText({
  text,
  textClassName = "",
  ...loaderProps
}: LoaderWithTextProps) {
  return (
    <span className="flex items-center justify-center">
      <Loader
        {...loaderProps}
        className={`mr-2 ${loaderProps.className || ""}`}
      />
      <span className={textClassName}>{text}</span>
    </span>
  );
}
