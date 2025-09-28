import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-300 ease-out",
  {
    variants: {
      variant: {
        default: "border-neutral-200 bg-white",
        elevated: "border-neutral-200 bg-white shadow-lg",
        interactive: "border-neutral-200 bg-white hover:shadow-xl hover:-translate-y-1 cursor-pointer",
        gradient: "border-0 bg-gradient-to-br from-white to-neutral-50 shadow-md",
        success: "border-green-200 bg-green-50",
        warning: "border-yellow-200 bg-yellow-50",
        error: "border-red-200 bg-red-50",
        info: "border-blue-200 bg-blue-50",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  interactive?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ 
          variant: interactive ? "interactive" : variant, 
          padding, 
          className 
        })
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6 pb-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-tight tracking-tight text-neutral-900",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-neutral-600 leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Componente de Status Badge para cards
const CardBadge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "success" | "warning" | "error" | "info" | "neutral"
  }
>(({ className, variant = "neutral", children, ...props }, ref) => {
  const badgeVariants = {
    success: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    error: "bg-red-100 text-red-800 border-red-200",
    info: "bg-blue-100 text-blue-800 border-blue-200",
    neutral: "bg-neutral-100 text-neutral-800 border-neutral-200",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
CardBadge.displayName = "CardBadge"

// Componente de Avatar para cards
const CardAvatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    src?: string
    alt?: string
    fallback?: string
    size?: "sm" | "md" | "lg"
  }
>(({ className, src, alt, fallback, size = "md", ...props }, ref) => {
  const sizeVariants = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full bg-neutral-100 font-medium text-neutral-600 overflow-hidden",
        sizeVariants[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  )
})
CardAvatar.displayName = "CardAvatar"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardBadge,
  CardAvatar,
  cardVariants 
}
