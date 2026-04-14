import { Form, Head, usePage } from '@inertiajs/react';
import MainLayout from '@/layouts/app/main-layout';
import { ReactNode } from 'react';

interface ContactContent {
    phone_numbers?: string[];
    email?: string;
    address?: string;
    map_embed_url?: string;
}

interface ContactPageData {
    title: string;
    content?: ContactContent;
}

function Contact() {
    const { page } = usePage<{ page: ContactPageData }>().props;
    const content = page.content ?? {};

    return (
        <>
            <Head title={page.title} />

            <section className="rounded-3xl bg-white p-6 shadow-sm dark:bg-gray-900 md:p-10">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {page.title}
                </h1>

                <div className="mt-6 grid gap-8 lg:grid-cols-2">
                    <Form
                        action="/community/contact"
                        method="post"
                        className="space-y-3"
                    >
                        {({ processing, errors }) => (
                            <>
                                <input
                                    name="name"
                                    required
                                    placeholder="Your name"
                                    className="w-full rounded-lg border p-2"
                                />
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="Your email"
                                    className="w-full rounded-lg border p-2"
                                />
                                <input
                                    name="phone"
                                    placeholder="Phone (optional)"
                                    className="w-full rounded-lg border p-2"
                                />
                                <input
                                    name="subject"
                                    placeholder="Subject"
                                    className="w-full rounded-lg border p-2"
                                />
                                <textarea
                                    name="message"
                                    required
                                    placeholder="Your message"
                                    className="h-28 w-full rounded-lg border p-2"
                                />
                                {Object.values(errors).length ? (
                                    <p className="text-sm text-red-600">
                                        Please check your inputs.
                                    </p>
                                ) : null}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
                                >
                                    Send message
                                </button>
                            </>
                        )}
                    </Form>

                    <div className="space-y-3">
                        <h2 className="text-xl font-semibold">Direct Contact</h2>
                        {content.phone_numbers?.map((phone) => (
                            <p key={phone} className="text-slate-700 dark:text-slate-300">
                                <strong>Phone:</strong> {phone}
                            </p>
                        ))}
                        {content.email ? (
                            <p className="text-slate-700 dark:text-slate-300">
                                <strong>Email:</strong> {content.email}
                            </p>
                        ) : null}
                        {content.address ? (
                            <p className="text-slate-700 dark:text-slate-300">
                                <strong>Location:</strong> {content.address}
                            </p>
                        ) : null}

                        {content.map_embed_url ? (
                            <div className="overflow-hidden rounded-xl border">
                                <iframe
                                    title="School location map"
                                    src={content.map_embed_url}
                                    width="100%"
                                    height="260"
                                    loading="lazy"
                                    className="border-0"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>
        </>
    );
}

Contact.layout = (page: ReactNode) => <MainLayout children={page} />;

export default Contact;

