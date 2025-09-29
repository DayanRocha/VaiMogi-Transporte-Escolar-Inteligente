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
			padding: {
				DEFAULT: '1rem',
				sm: '1.5rem',
				md: '2rem',
				lg: '3rem',
				xl: '4rem',
				'2xl': '5rem'
			},
			screens: {
				sm: '640px',
				md: '768px',
				lg: '1024px',
				xl: '1280px',
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
					foreground: 'hsl(var(--primary-foreground))',
					50: 'hsl(35 100% 95%)',
					100: 'hsl(35 100% 90%)',
					200: 'hsl(35 100% 80%)',
					300: 'hsl(35 100% 70%)',
					400: 'hsl(35 100% 60%)',
					500: 'hsl(30 100% 50%)',
					600: 'hsl(25 100% 45%)',
					700: 'hsl(20 100% 40%)',
					800: 'hsl(15 100% 35%)',
					900: 'hsl(10 100% 30%)',
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
				// Cores neutras aprimoradas
				neutral: {
					50: 'hsl(0 0% 99%)',
					100: 'hsl(220 14% 98%)',
					200: 'hsl(220 14% 96%)',
					300: 'hsl(220 13% 91%)',
					400: 'hsl(220 14% 83%)',
					500: 'hsl(220 13% 69%)',
					600: 'hsl(220 9% 46%)',
					700: 'hsl(215 25% 27%)',
					800: 'hsl(215 25% 15%)',
					900: 'hsl(222 84% 5%)',
				},
				// Cores funcionais
				success: {
					50: 'hsl(142 76% 95%)',
					100: 'hsl(142 76% 90%)',
					500: 'hsl(142 76% 36%)',
					600: 'hsl(142 76% 30%)',
				},
				warning: {
					50: 'hsl(38 92% 95%)',
					100: 'hsl(38 92% 90%)',
					500: 'hsl(38 92% 50%)',
					600: 'hsl(38 92% 45%)',
				},
				error: {
					50: 'hsl(0 84% 95%)',
					100: 'hsl(0 84% 90%)',
					500: 'hsl(0 84% 60%)',
					600: 'hsl(0 84% 55%)',
				},
				info: {
					50: 'hsl(210 100% 95%)',
					100: 'hsl(210 100% 90%)',
					500: 'hsl(210 100% 50%)',
					600: 'hsl(210 100% 45%)',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				xl: '1rem',
				'2xl': '1.5rem',
				'3xl': '2rem',
			},
			spacing: {
				'safe-area-inset-bottom': 'env(safe-area-inset-bottom)',
			},
			fontFamily: {
				sans: [
					'Inter',
					'-apple-system',
					'BlinkMacSystemFont',
					'Segoe UI',
					'Roboto',
					'Helvetica Neue',
					'Arial',
					'sans-serif'
				],
				mono: [
					'JetBrains Mono',
					'SF Mono',
					'Monaco',
					'Inconsolata',
					'Roboto Mono',
					'monospace'
				]
			},
			fontSize: {
				'display': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
				'h1': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
				'h2': ['2rem', { lineHeight: '1.3' }],
				'h3': ['1.5rem', { lineHeight: '1.4' }],
				'body-lg': ['1.125rem', { lineHeight: '1.6' }],
				'body': ['1rem', { lineHeight: '1.5' }],
				'body-sm': ['0.875rem', { lineHeight: '1.4' }],
				'caption': ['0.75rem', { lineHeight: '1.3', letterSpacing: '0.05em' }],
			},
			boxShadow: {
				'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
				'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
				'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
				'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
				'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
				'2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'slide-up': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					'0%': { opacity: '0', transform: 'scale(0.95)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				'bounce-gentle': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-up': 'slide-up 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'bounce-gentle': 'bounce-gentle 2s infinite',
				// Pulso mais lento para reduzir a velocidade
				'pulse-slow': 'pulse 10s cubic-bezier(0.4, 0, 0.6, 1) infinite'
			},
			backdropBlur: {
				xs: '2px',
			}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		require("@tailwindcss/typography")
	],
} satisfies Config;
