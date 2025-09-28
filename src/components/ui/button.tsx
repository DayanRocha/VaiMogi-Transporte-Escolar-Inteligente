import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:transform-none touch-manipulation [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:scale-105 active:scale-95 shadow-md",
        destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:scale-105 active:scale-95 shadow-md",
        outline: "border-2 border-orange-500 bg-white text-orange-600 hover:bg-orange-500 hover:text-white hover:shadow-lg hover:scale-105 active:scale-95",
        secondary: "bg-gradient-to-r from-neutral-100 to-neutral-200 text-neutral-900 hover:from-neutral-200 hover:to-neutral-300 hover:shadow-md hover:scale-105 active:scale-95",
        ghost: "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 hover:scale-105 active:scale-95 rounded-lg",
        link: "text-orange-600 underline-offset-4 hover:underline hover:text-orange-700",
        success: "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-lg hover:scale-105 active:scale-95 shadow-md",
        warning: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 hover:shadow-lg hover:scale-105 active:scale-95 shadow-md",
        info: "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:scale-105 active:scale-95 shadow-md",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-14 rounded-2xl px-8 text-lg",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9 rounded-lg",
        "icon-lg": "h-14 w-14 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, loadingText, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {loadingText && <span className="sr-only">{loadingText}</span>}
          </>
        )}
        {!loading && children}
        {loading && !loadingText && children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
