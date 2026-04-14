import { login } from '@/routes';
import { store } from '@/routes/register';
import { Form, Head } from '@inertiajs/react';

import { SelectField, TextField } from '@/components/form-fields';
import { useFormToast } from '@/components/use-form-toast';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';

export default function Register() {
    const { onError } = useFormToast('Account created successfully.');

    return (
        <AuthLayout
            title="Create an account"
            description="Enter your details below to create your account"
        >
            <Head title="Register" />
            <Form
                {...store.form()}
                onError={onError}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <TextField label="Name" id="name" type="text" required autoFocus tabIndex={1} autoComplete="name" name="name" placeholder="Full name" error={errors.name} />
                            <TextField label="Email address" id="email" type="email" required tabIndex={2} autoComplete="email" name="email" placeholder="email@example.com" error={errors.email} />
                            <SelectField label="Account type" id="role" name="role" required tabIndex={3} defaultValue="family" error={errors.role}>
                                <option value="family">Student / Family</option>
                                <option value="teacher">Teacher</option>
                                <option value="management">School Management</option>
                            </SelectField>
                            <TextField label="Password" id="password" type="password" required tabIndex={4} autoComplete="new-password" name="password" placeholder="Password" error={errors.password} />
                            <TextField label="Confirm password" id="password_confirmation" type="password" required tabIndex={5} autoComplete="new-password" name="password_confirmation" placeholder="Confirm password" error={errors.password_confirmation} />

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={6}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Create account
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={7}>
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
