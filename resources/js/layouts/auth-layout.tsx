import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
import { FlashToastBridge } from '@/components/flash-toast-bridge';
import { ReactNode } from 'react';

export default function AuthLayout({
    children,
    title,
    description,
    ...props
}: {
    children: ReactNode;
    title: string;
    description: string;
}) {
    return (
        <AuthLayoutTemplate title={title} description={description} {...props}>
            <FlashToastBridge />
            {children}
        </AuthLayoutTemplate>
    );
}
