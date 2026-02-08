import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Toaster } from "sonner";
import ConnectionIndicator from "@/components/ConnectionIndicator";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {children}
          <Toaster richColors position="bottom-right" />
          <ConnectionIndicator />
        </body>
      </html>
    </ClerkProvider>
  )
}
