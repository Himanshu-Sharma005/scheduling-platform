import './globals.css';
import { ToastProvider } from '@/context/ToastContext';

export const metadata = {
  title: 'Cal.com Clone — Scheduling Platform',
  description: 'A full-stack scheduling and booking platform inspired by Cal.com. Manage event types, availability, and bookings.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
