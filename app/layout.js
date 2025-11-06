import './globals.css'

export const metadata = {
  title: 'Five Flows - Four Pillars of Destiny | Traditional Saju Analysis',
  description: 'Traditional Saju analysis based on the Five Elements for wellness and balance.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

