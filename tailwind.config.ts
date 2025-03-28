
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				idol: {
					black: '#000000',
					gold: 'var(--idol-gold)',
					silver: '#C0C0C0',
					white: '#FFFFFF',
					gray: 'var(--idol-gray)',
					primary: 'var(--idol-primary)',
					secondary: 'var(--idol-secondary)',
					accent: 'var(--idol-accent)',
				},
				// Theme-specific colors
				neonpop: {
					primary: '#007BFF',   // Electric Blue
					secondary: '#FF007F', // Neon Pink
					accent: '#8000FF',    // Violet
				},
				millennial: {
					primary: '#FFB6C1',   // Millennial Pink
					secondary: '#FFD700', // Cream Yellow
					accent: '#81D8D0',    // Tiffany Blue
				},
				retro: {
					primary: '#00FF7F',   // Fluorescent Green
					secondary: '#FFA500', // Bright Orange
					accent: '#1E90FF',    // Gem Blue
				},
				minimal: {
					primary: '#F5F5DC',   // Cream White
					secondary: '#D2B48C', // Light Brown
					accent: '#8F9779',    // Olive Green
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				'montserrat': ['Montserrat', 'sans-serif'],
				'open-sans': ['Open Sans', 'sans-serif'],
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'fade-up': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'shutter-flash': {
					'0%': { opacity: '0' },
					'25%': { opacity: '1' },
					'50%': { opacity: '0' },
					'75%': { opacity: '0.8' },
					'100%': { opacity: '0' }
				},
				'pulse-slight': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.8' }
				},
				'scale-in': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'scale-out': {
					'0%': { transform: 'scale(1)', opacity: '1' },
					'100%': { transform: 'scale(0.95)', opacity: '0' }
				},
				'slide-up': {
					'0%': { transform: 'translateY(100%)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'slide-down': {
					'0%': { transform: 'translateY(-100%)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'slide-left': {
					'0%': { transform: 'translateX(100%)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' }
				},
				'slide-right': {
					'0%': { transform: 'translateX(-100%)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' }
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.6s ease-out',
				'fade-up': 'fade-up 0.8s ease-out',
				'shutter-flash': 'shutter-flash 0.8s ease-out',
				'pulse-slight': 'pulse-slight 2s ease-in-out infinite',
				'scale-in': 'scale-in 0.4s ease-out',
				'scale-out': 'scale-out 0.4s ease-out',
				'slide-up': 'slide-up 0.6s ease-out',
				'slide-down': 'slide-down 0.6s ease-out',
				'slide-left': 'slide-left 0.6s ease-out',
				'slide-right': 'slide-right 0.6s ease-out',
			},
			boxShadow: {
				'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
				'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.05)',
				'neo': '8px 8px 16px #d1d1d1, -8px -8px 16px #ffffff',
				'neon': '0 0 5px var(--idol-primary), 0 0 20px var(--idol-primary)',
			},
			backdropBlur: {
				'glass': 'blur(16px)',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
	safelist: [
		{
		  pattern: /^ring-idol-/,
		  variants: ['focus', 'hover'],
		},
		{
		  pattern: /idol-(gold|primary|secondary|accent)\/\d+/,
		},
		{
		  pattern: /^bg-idol-/,
		  variants: ['hover', 'focus'],
		},
		{
		  pattern: /^bg-opacity-/,
		  variants: ['hover', 'focus'],
		},
		{
		  pattern: /^border-idol-/,
		  variants: ['hover', 'focus'],
		},
		{
		  pattern: /^border-opacity-/,
		  variants: ['hover', 'focus'],
		}
	]
} satisfies Config;
