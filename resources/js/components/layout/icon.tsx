/**
 * Thin wrapper that gives a passed-in Lucide icon a consistent 4x4 box.
 *
 * The component type is injected rather than looked up by name, which lets call
 * sites keep tree-shakeable direct imports. Distinct from `@/components/ui/icon`,
 * which tolerates a missing icon and forwards no props.
 */
import { cn } from '@/lib/utils';
import { type LucideProps } from 'lucide-react';
import { type ComponentType } from 'react';

interface IconProps extends Omit<LucideProps, 'ref'> {
    iconNode: ComponentType<LucideProps>;
}

export function Icon({
    iconNode: IconComponent,
    className,
    ...props
}: IconProps) {
    return <IconComponent className={cn('h-4 w-4', className)} {...props} />;
}
