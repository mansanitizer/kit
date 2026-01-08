import { createServerClient } from '@/lib/supabase-server';

export type RecycleItemType = 'tool' | 'file' | 'interaction';

/**
 * Moves an item to the recycle bin (inserts into recycle_bin table).
 * Does NOT perform the actual delete from the source table.
 */
export async function moveToRecycleBin(
    itemType: RecycleItemType,
    originalId: string,
    displayText: string,
    data: any,
    userId?: string | null
): Promise<boolean> {
    const supabase = createServerClient(); // Use server client

    const { error } = await supabase
        .from('recycle_bin')
        .insert({
            original_id: originalId,
            item_type: itemType,
            display_text: displayText,
            data: data,
            user_id: userId
        });

    if (error) {
        console.error(`Failed to move ${itemType}:${originalId} to recycle bin:`, error);
        return false;
    }

    return true;
}
