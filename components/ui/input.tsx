import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  noInfoButton?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, noInfoButton, ...props }, ref) => {
    const [noInfo, setNoInfo] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    
    const handleNoInfoClick = () => {
      if (window.confirm(`You are going to enter NA for this field. Are you sure?`)) {
        setNoInfo(true);
        // Set value to "NA" for form submission
        if (inputRef.current && props.name) {
          inputRef.current.value = "NA";
        }
      }
    };

    const resetNoInfo = () => {
      setNoInfo(false);
      // Clear the value when reset
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    };

    return (
      <div className="relative flex w-full">
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            noInfo && "bg-gray-100",
            className
          )}
          ref={(node) => {
            // Handle both refs
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
            inputRef.current = node;
          }}
          disabled={noInfo}
          placeholder={noInfo ? "NA" : props.placeholder}
          {...props}
          value={noInfo ? "NA" : props.value}
        />
        {!noInfo && !noInfoButton && (
          <button
            type="button"
            onClick={handleNoInfoClick}
            className="absolute right-0 top-0 px-3 py-2 text-xs text-gray-500 hover:text-gray-700"
          >
            Don&apos;t have information
          </button>
        )}
        {noInfo && (
          <button
            type="button"
            onClick={resetNoInfo}
            className="absolute right-0 top-0 flex items-center justify-center h-9 w-9 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
