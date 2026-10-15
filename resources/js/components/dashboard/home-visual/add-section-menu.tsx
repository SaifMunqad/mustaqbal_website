import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TypeOption } from '@/components/dashboard/home-section-form';
import { useTranslation } from 'react-i18next';

interface AddSectionMenuProps {
    typeOptions: TypeOption[];
    onAdd: (option: TypeOption) => void;
}

/**
 * Type picker for appending a new block to the layout. The chosen type drives
 * whether it becomes an authored (self-contained) or curated (live-content)
 * block; the parent decides the variant.
 */
export default function AddSectionMenu({ typeOptions, onAdd }: AddSectionMenuProps) {
    const { t } = useTranslation();

    const curated = typeOptions.filter((option) => option.kind === 'curated');
    const authored = typeOptions.filter((option) => option.kind === 'authored');

    const item = (option: TypeOption) => (
        <DropdownMenuItem
            key={option.value}
            onSelect={() => onAdd(option)}
        >
            {t(
                `enums.homeSectionType.${option.value}`,
                option.label,
            )}
        </DropdownMenuItem>
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" type="button">
                    + Add section
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Live content</DropdownMenuLabel>
                {curated.map(item)}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Home-only</DropdownMenuLabel>
                {authored.map(item)}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
