import DashboardPage from '@/components/dashboard/dashboard-page';
import PostForm, {
    type Post,
    type PostUserOption,
    type PostTypeOption,
    type TranslationValues,
} from '@/components/dashboard/posts/post-form';
import { useFormToast } from '@/components/use-form-toast';
import { usePage } from '@inertiajs/react';
import posts from '@/routes/dashboard/posts';

interface PostEditProps {
    users: PostUserOption[];
    post: Post;
    postTypes: PostTypeOption[];
    translations: TranslationValues;
    [key: string]: unknown;
}

export default function DashboardPostsEdit() {
    const { users, post, postTypes, translations } =
        usePage<PostEditProps>().props;
    const { onError } = useFormToast('Post updated successfully.');

    return (
        <DashboardPage titleKey="dashboard.posts.editTitle">
            <PostForm
                formProps={posts.update.form(post.id)}
                submitLabel="Update post"
                cancelHref={posts.index.url()}
                users={users}
                postTypes={postTypes}
                post={post}
                translations={translations}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
