import ButtonDefault from '@/components/general/elements/buttons/button';
import PrimaryButton from '@/components/general/elements/buttons/primary-button';
import MainLayout from '@/layouts/app/main-layout';
import { ReactNode } from 'react';

function Welcome() {
    return (
        <>
            <PrimaryButton />
            <ButtonDefault />
            {/*<Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>*/}

            {/*<img
                className={'min-h-screen'}
                src={
                    'https://images.unsplash.com/photo-1761069234555-272f68348b53?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1175'
                }
            />*/}
        </>
    );
}

// Use the layout
Welcome.layout = (page: ReactNode) => <MainLayout children={page}></MainLayout>;
export default Welcome;
