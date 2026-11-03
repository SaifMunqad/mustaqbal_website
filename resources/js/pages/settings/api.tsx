import HeadingSmall from '@/components/general/elements/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';

type ApiToken = {
    id: number;
    name: string;
    last_used_at: string | null;
    created_at: string;
};

type OAuthClient = {
    id: string;
    name: string;
    grant_types: string[];
    redirect_uris?: string[];
    created_at: string;
};

type NewOAuthClient = {
    id: string;
    secret: string;
    name: string;
    redirect_uris?: string[];
};

export default function ApiSettings({
    tokens,
    newToken,
    oauthClients,
    newOAuthClient,
}: {
    tokens: ApiToken[];
    newToken?: string | null;
    oauthClients: OAuthClient[];
    newOAuthClient?: NewOAuthClient | null;
}) {
    const visibleToken = newToken;
    const visibleOAuthClient = newOAuthClient;
    const form = useForm({ name: '' });
    const oauthForm = useForm({
        name: '',
        redirect_uri: 'https://oauth-redirect.googleusercontent.com',
    });
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
                                This secret is shown only once. Store it
                                securely.
                            </p>
                            <Input
                                readOnly
                                value={visibleToken}
                                onFocus={(event) =>
                                    event.currentTarget.select()
                                }
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    void navigator.clipboard?.writeText(
                                        visibleToken,
                                    );
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
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                maxLength={255}
                                placeholder="e.g. MCP integration"
                                required
                            />
                            {form.errors.name && (
                                <p className="text-sm text-destructive">
                                    {form.errors.name}
                                </p>
                            )}
                        </div>
                        <Button type="submit" disabled={form.processing}>
                            Create API key
                        </Button>
                    </form>

                    <div className="space-y-3">
                        <h3 className="font-medium">Existing API keys</h3>
                        {tokens.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No personal API keys yet.
                            </p>
                        ) : (
                            <ul className="divide-y rounded-md border">
                                {tokens.map((token) => (
                                    <li
                                        key={token.id}
                                        className="flex items-center justify-between p-4"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {token.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Created{' '}
                                                {new Date(
                                                    token.created_at,
                                                ).toLocaleString()}
                                                {token.last_used_at &&
                                                    ` · Last used ${new Date(token.last_used_at).toLocaleString()}`}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={() => {
                                                if (
                                                    window.confirm(
                                                        `Revoke “${token.name}”? This cannot be undone.`,
                                                    )
                                                ) {
                                                    router.delete(
                                                        `/settings/api/${token.id}`,
                                                    );
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

                    {/* OAuth Clients */}
                    <div className="space-y-4 rounded-md border p-6">
                        <HeadingSmall
                            title="OAuth Credentials"
                            description="Create OAuth credentials for clients like Gemini Spark that connect to your MCP server. Supports both Authorization Code and Password grants."
                        />

                        {visibleOAuthClient && (
                            <div className="space-y-3 rounded-md border border-green-600 p-4">
                                <p className="font-medium">
                                    Copy these credentials now
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    The client secret is shown only once. Store
                                    it securely.
                                </p>

                                <div className="space-y-2">
                                    <Label>Client ID</Label>
                                    <Input
                                        readOnly
                                        value={visibleOAuthClient.id}
                                        onFocus={(event) =>
                                            event.currentTarget.select()
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Client Secret</Label>
                                    <Input
                                        readOnly
                                        value={visibleOAuthClient.secret}
                                        onFocus={(event) =>
                                            event.currentTarget.select()
                                        }
                                    />
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        void navigator.clipboard?.writeText(
                                            `Client ID: ${visibleOAuthClient.id}\nClient Secret: ${visibleOAuthClient.secret}`,
                                        );
                                    }}
                                >
                                    Copy both
                                </Button>
                            </div>
                        )}

                        <form
                            className="space-y-3"
                            onSubmit={(event) => {
                                event.preventDefault();
                                oauthForm.post('/settings/oauth-clients', {
                                    onSuccess: () => {
                                        oauthForm.reset();
                                    },
                                });
                            }}
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="oauth-client-name">
                                    Client name
                                </Label>
                                <Input
                                    id="oauth-client-name"
                                    value={oauthForm.data.name}
                                    onChange={(event) =>
                                        oauthForm.setData(
                                            'name',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={255}
                                    placeholder="e.g. Gemini Spark"
                                    required
                                />
                                {oauthForm.errors.name && (
                                    <p className="text-sm text-destructive">
                                        {oauthForm.errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="oauth-redirect-uri">
                                    Redirect URI
                                </Label>
                                <Input
                                    id="oauth-redirect-uri"
                                    value={oauthForm.data.redirect_uri}
                                    onChange={(event) =>
                                        oauthForm.setData(
                                            'redirect_uri',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={1000}
                                    placeholder="https://oauth-redirect.googleusercontent.com"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Defaults to Google's OAuth relay for Gemini
                                    Spark (comma-separated for multiples).
                                </p>
                                {oauthForm.errors.redirect_uri && (
                                    <p className="text-sm text-destructive">
                                        {oauthForm.errors.redirect_uri}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={oauthForm.processing}
                            >
                                Create OAuth client
                            </Button>
                        </form>

                        <div className="space-y-3">
                            <h3 className="font-medium">
                                Existing OAuth clients
                            </h3>
                            {oauthClients.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No OAuth clients yet.
                                </p>
                            ) : (
                                <ul className="divide-y rounded-md border">
                                    {oauthClients.map((client) => (
                                        <li
                                            key={client.id}
                                            className="flex items-center justify-between gap-4 p-4"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {client.name}
                                                </p>
                                                <p className="font-mono text-sm text-muted-foreground">
                                                    {client.id}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Grants:{' '}
                                                    {client.grant_types.join(
                                                        ', ',
                                                    )}{' '}
                                                    · Created{' '}
                                                    {new Date(
                                                        client.created_at,
                                                    ).toLocaleString()}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                onClick={() => {
                                                    if (
                                                        window.confirm(
                                                            `Revoke "${client.name}"? This cannot be undone.`,
                                                        )
                                                    ) {
                                                        router.delete(
                                                            `/settings/oauth-clients/${client.id}`,
                                                        );
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
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
