import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { SovereignSentinel } from '@/components/compliance/SovereignSentinel';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: 'PlanTune — AI Credit Strategy Engine',
    description: 'The definitive authority on AI Credits & Token economics. Model, compare, and optimise your credit consumption across AI providers.',
    keywords: ['AI credits', 'token management', 'pricing strategy', 'Gemini', 'credit analytics'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
            <body className="antialiased">
                <AuthProvider>
                    <SovereignSentinel />
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
