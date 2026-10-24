/**
 * Default layout for the authentication screens, delegating to the simple
 * centred variant while requiring a title and description.
 */
import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
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
            {children}
        </AuthLayoutTemplate>
    );
}
