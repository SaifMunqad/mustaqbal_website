import DashboardPage from '@/components/dashboard/dashboard-page';
import PostForm, {
    type PostUserOption,
    type PostTypeOption,
} from '@/components/dashboard/posts/post-form';
import { useFormToast } from '@/components/use-form-toast';
import { usePage } from '@inertiajs/react';
import posts from '@/routes/dashboard/posts';

interface PostCreateProps {
    users: PostUserOption[];
    postTypes: PostTypeOption[];
    [key: string]: unknown;
}

export default function DashboardPostsCreate() {
    const { users, postTypes } = usePage<PostCreateProps>().props;
    const { onError } = useFormToast('Post created successfully.');

    return (
        <DashboardPage titleKey="dashboard.posts.createTitle">
            <PostForm
                formProps={posts.store.form()}
                submitLabel="Save post"
                cancelHref={posts.index.url()}
                users={users}
                postTypes={postTypes}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
