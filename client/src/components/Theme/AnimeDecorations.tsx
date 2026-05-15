import React, { useEffect, useState } from 'react'
import { useTheme } from './ThemeProvider'

// Floating decorative elements for the warm theme
// Inspired by: Yuru Camp (camping/nature), K-ON! (music/tea), KyoAni (soft light)

const SakuraPetal: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={style} className="pointer-events-none">
    <path
      d="M8 0C8 0 10 4 8 8C6 4 8 0 8 0Z"
      fill="#f8c3d0"
      opacity="0.6"
      transform="rotate(30 8 8)"
    />
    <path
      d="M8 0C8 0 10 4 8 8C6 4 8 0 8 0Z"
      fill="#f2a7b3"
      opacity="0.4"
      transform="rotate(90 8 8)"
    />
    <path
      d="M8 0C8 0 10 4 8 8C6 4 8 0 8 0Z"
      fill="#f8c3d0"
      opacity="0.5"
      transform="rotate(150 8 8)"
    />
    <path
      d="M8 0C8 0 10 4 8 8C6 4 8 0 8 0Z"
      fill="#f2a7b3"
      opacity="0.4"
      transform="rotate(210 8 8)"
    />
    <path
      d="M8 0C8 0 10 4 8 8C6 4 8 0 8 0Z"
      fill="#f8c3d0"
      opacity="0.5"
      transform="rotate(270 8 8)"
    />
    <circle cx="8" cy="8" r="1.5" fill="#e88d67" opacity="0.7" />
  </svg>
)

const Leaf: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <svg width="14" height="18" viewBox="0 0 14 18" style={style} className="pointer-events-none">
    <path
      d="M7 0C7 0 14 6 14 12C14 16 10 18 7 18C4 18 0 16 0 12C0 6 7 0 7 0Z"
      fill="#a3d9a5"
      opacity="0.35"
    />
    <path
      d="M7 3L7 15"
      stroke="#7fb069"
      strokeWidth="0.8"
      opacity="0.4"
    />
    <path d="M7 7L4 5" stroke="#7fb069" strokeWidth="0.5" opacity="0.3" />
    <path d="M7 10L10 8" stroke="#7fb069" strokeWidth="0.5" opacity="0.3" />
  </svg>
)

const Star: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" style={style} className="pointer-events-none">
    <path
      d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z"
      fill="#f0b429"
      opacity="0.3"
    />
  </svg>
)

const Campfire: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" style={style} className="pointer-events-none">
    <path
      d="M12 2C12 2 16 8 16 12C16 16 14 18 12 18C10 18 8 16 8 12C8 8 12 2 12 2Z"
      fill="#e88d67"
      opacity="0.25"
    />
    <path
      d="M12 6C12 6 14 10 14 12C14 14 13 15 12 15C11 15 10 14 10 12C10 10 12 6 12 6Z"
      fill="#f0b429"
      opacity="0.3"
    />
    <path d="M8 18L16 18" stroke="#8b7a6b" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
    <path d="M9 19L15 19" stroke="#8b7a6b" strokeWidth="1" opacity="0.15" strokeLinecap="round" />
  </svg>
)

const TeaCup: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <svg width="20" height="18" viewBox="0 0 20 18" style={style} className="pointer-events-none">
    <path
      d="M3 4L3 14C3 16 5 18 8 18L12 18C15 18 17 16 17 14L17 4Z"
      fill="#fef3e2"
      stroke="#e6d5c3"
      strokeWidth="0.8"
      opacity="0.4"
    />
    <path
      d="M17 6C17 6 20 6 20 9C20 12 17 12 17 12"
      stroke="#e6d5c3"
      strokeWidth="0.8"
      fill="none"
      opacity="0.3"
    />
    {/* Steam */}
    <path d="M8 2C8 2 9 0 8 -1" stroke="#8b7a6b" strokeWidth="0.5" opacity="0.2" fill="none" />
    <path d="M12 2C12 2 13 0 12 -1" stroke="#8b7a6b" strokeWidth="0.5" opacity="0.2" fill="none" />
  </svg>
)

// Floating animation keyframes as CSS
const floatAnimation = `
@keyframes anime-float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-15px) rotate(5deg); }
  50% { transform: translateY(-8px) rotate(-3deg); }
  75% { transform: translateY(-20px) rotate(2deg); }
}
@keyframes anime-fall {
  0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
}
@keyframes anime-twinkle {
  0%, 100% { opacity: 0.2; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}
`

interface DecorationItem {
  id: number
  type: 'sakura' | 'leaf' | 'star' | 'campfire' | 'tea'
  x: number
  y: number
  size: number
  delay: number
  duration: number
}

function generateDecorations(count: number): DecorationItem[] {
  const types: DecorationItem['type'][] = ['sakura', 'leaf', 'star', 'campfire', 'tea']
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    type: types[i % types.length],
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 0.6 + Math.random() * 0.8,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 8,
  }))
}

export default function AnimeDecorations() {
  const { themeName } = useTheme()
  const [items, setItems] = useState<DecorationItem[]>([])

  useEffect(() => {
    if (themeName === 'anime') {
      setItems(generateDecorations(18))
    } else {
      setItems([])
    }
  }, [themeName])

  if (themeName !== 'anime' || items.length === 0) return null

  return (
    <>
      <style>{floatAnimation}</style>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {items.map((item) => {
          const style: React.CSSProperties = {
            position: 'absolute',
            left: `${item.x}%`,
            top: `${item.y}%`,
            transform: `scale(${item.size})`,
            animation:
              item.type === 'star'
                ? `anime-twinkle ${item.duration}s ease-in-out ${item.delay}s infinite`
                : item.type === 'sakura' || item.type === 'leaf'
                ? `anime-fall ${item.duration + 6}s linear ${item.delay}s infinite`
                : `anime-float ${item.duration}s ease-in-out ${item.delay}s infinite`,
          }

          switch (item.type) {
            case 'sakura':
              return <SakuraPetal key={item.id} style={style} />
            case 'leaf':
              return <Leaf key={item.id} style={style} />
            case 'star':
              return <Star key={item.id} style={style} />
            case 'campfire':
              return <Campfire key={item.id} style={style} />
            case 'tea':
              return <TeaCup key={item.id} style={style} />
            default:
              return null
          }
        })}
      </div>
    </>
  )
}
