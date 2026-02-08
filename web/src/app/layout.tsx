import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Toaster } from "sonner";
import ConnectionIndicator from "@/components/ConnectionIndicator";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const content = (
    <html lang="en">
      <body>
        {children}
        <Toaster richColors position="bottom-right" />
        <ConnectionIndicator />
      </body>
    </html>
  );

  return (
    publishableKey
      ? <ClerkProvider publishableKey={publishableKey}>{content}</ClerkProvider>
      : content
  );
}
