import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Carebook • Your health, your time', description: 'Interactive healthcare booking prototype' };
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
