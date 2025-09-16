import type React from "react"
import type { Metadata } from "next"
import { Inter, Yatra_One } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth-provider"
import { GuestModeProvider } from "@/components/guest-mode-provider"
import ClientRoot from "@/components/client-root"

const inter = Inter({ subsets: ["latin"] })
const yatraOne = Yatra_One({ 
  subsets: ["latin"],
  weight: "400",
  variable: "--font-yatra-one"
})

export const metadata: Metadata = {
  title: "P.L.A.T.E – Personalized Learning And Assistance For Taste Enhancement",
  description: "Transform your ingredients into delicious recipes with our intelligent cooking assistant",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${yatraOne.variable}`}>
        <AuthProvider>
          <GuestModeProvider>
            <ClientRoot>
              {children}
            </ClientRoot>
          </GuestModeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
