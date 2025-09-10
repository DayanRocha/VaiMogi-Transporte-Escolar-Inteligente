import { useCallback, useEffect, useImperativeHandle, useRef } from "react"
import confetti from "canvas-confetti"

export interface ConfettiRef {
  fire: (opts?: Parameters<typeof confetti>[0]) => void
}

export interface ConfettiProps {
  className?: string
  onMouseEnter?: () => void
}

export const Confetti = ({ className, onMouseEnter }: ConfettiProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      const myConfetti = confetti.create(canvasRef.current, {
        resize: true,
        useWorker: true,
      })

      // Fire initial confetti
      setTimeout(() => {
        myConfetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
      }, 100)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      onMouseEnter={onMouseEnter}
    />
  )
}

export const ConfettiButton = ({ 
  children, 
  options, 
  ...props 
}: {
  children: React.ReactNode
  options?: Parameters<typeof confetti>[0]
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const handleClick = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      ...options,
    })
  }, [options])

  return (
    <button {...props} onClick={handleClick}>
      {children}
    </button>
  )
}