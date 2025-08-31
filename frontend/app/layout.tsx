import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth-provider"
import ClientRoot from "@/components/client-root"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "P.L.A.T.E – Your Personal AI Chef",
  description: "Discover and cook creative meals with the ingredients you have",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientRoot>
          {children}
        </ClientRoot>
      </body>
    </html>
  )
}
