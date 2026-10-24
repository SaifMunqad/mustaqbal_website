/**
 * Create screen for a community post, bound to the shared `PostForm`.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import PostForm, {
    type PostUserOption,
    type PostTypeOption,
} from '@/components/dashboard/posts/post-form';
import { useFormToast } from '@/components/feedback/use-form-toast';
import { usePage } from '@inertiajs/react';
import posts from '@/routes/dashboard/posts';
import { useTranslation } from 'react-i18next';

interface PostCreateProps {
    users: PostUserOption[];
    postTypes: PostTypeOption[];
    [key: string]: unknown;
}

export default function DashboardPostsCreate() {
    const { t } = useTranslation();
    const { users, postTypes } = usePage<PostCreateProps>().props;
    const { onError } = useFormToast(t('dashboard.posts.created'));

    return (
        <DashboardPage titleKey="dashboard.posts.createTitle">
            <PostForm
                formProps={posts.store.form()}
                submitLabel={t('dashboard.posts.form.save')}
                cancelHref={posts.index.url()}
                users={users}
                postTypes={postTypes}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
