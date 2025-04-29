"use client"

import { useEffect, useRef } from "react"

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Matrix characters (using dots and circles for a more subtle effect)
    const chars = "•○◦"
    const fontSize = 14
    const columns = Math.floor(canvas.width / fontSize)
    const drops: number[] = Array(columns).fill(0)
    
    // Brand colors
    const purpleColor = "rgba(147, 51, 234, 0.7)" // solv-purple
    const lightPurpleColor = "rgba(168, 85, 247, 0.5)" // solv-lightPurple
    
    ctx.font = `${fontSize}px monospace`

    const draw = () => {
      // Semi-transparent black to create fade effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < drops.length; i++) {
        // Random character from the chars string
        const char = chars[Math.floor(Math.random() * chars.length)]
        
        // Alternate between brand colors
        ctx.fillStyle = Math.random() > 0.5 ? purpleColor : lightPurpleColor
        
        // Draw the character
        ctx.fillText(char, i * fontSize, drops[i] * fontSize)

        // Reset drop when it reaches bottom or randomly
        if (drops[i] * fontSize > canvas.height || Math.random() > 0.98) {
          drops[i] = 0
        }

        // Move drop down
        drops[i]++
      }
    }

    // Animation loop
    const interval = setInterval(draw, 50)

    return () => {
      clearInterval(interval)
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-30"
      style={{ zIndex: 0 }}
    />
  )
} 