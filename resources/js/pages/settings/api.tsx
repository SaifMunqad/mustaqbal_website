import HeadingSmall from '@/components/general/elements/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type ApiToken = {
    id: number;
    name: string;
    last_used_at: string | null;
    created_at: string;
};

export default function ApiSettings({
    tokens,
    newToken,
}: {
    tokens: ApiToken[];
    newToken?: string | null;
}) {
    const [visibleToken, setVisibleToken] = useState(newToken);
    useEffect(() => setVisibleToken(newToken), [newToken]);
    const form = useForm({ name: '' });
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'API keys', href: '/settings/api' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="API keys" />
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="API keys"
                        description="Create and manage personal API keys for integrations such as MCP. Each key has the same permissions as your account."
                    />

                    {visibleToken && (
                        <div className="space-y-2 rounded-md border border-green-600 p-4">
                            <p className="font-medium">Copy this key now</p>
                            <p className="text-sm text-muted-foreground">
                                This secret is shown only once. Store it securely.
                            </p>
                            <Input readOnly value={visibleToken} onFocus={(event) => event.currentTarget.select()} />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    void navigator.clipboard?.writeText(visibleToken);
                                }}
                            >
                                Copy key
                            </Button>
                        </div>
                    )}

                    <form
                        className="space-y-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/settings/api', {
                                onSuccess: () => {
                                    form.reset();
                                },
                            });
                        }}
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="token-name">Key name</Label>
                            <Input
                                id="token-name"
                                value={form.data.name}
                                onChange={(event) => form.setData('name', event.target.value)}
                                maxLength={255}
                                placeholder="e.g. MCP integration"
                                required
                            />
                            {form.errors.name && (
                                <p className="text-sm text-destructive">{form.errors.name}</p>
                            )}
                        </div>
                        <Button type="submit" disabled={form.processing}>
                            Create API key
                        </Button>
                    </form>

                    <div className="space-y-3">
                        <h3 className="font-medium">Existing keys</h3>
                        {tokens.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No API keys yet.</p>
                        ) : (
                            <ul className="divide-y rounded-md border">
                                {tokens.map((token) => (
                                    <li key={token.id} className="flex items-center justify-between gap-4 p-4">
                                        <div>
                                            <p className="font-medium">{token.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Created {new Date(token.created_at).toLocaleString()} · Last used{' '}
                                                {token.last_used_at ? new Date(token.last_used_at).toLocaleString() : 'Never'}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={() => {
                                                if (window.confirm(`Revoke “${token.name}”? This cannot be undone.`)) {
                                                    router.delete(`/settings/api/${token.id}`);
                                                }
                                            }}
                                        >
                                            Revoke
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}