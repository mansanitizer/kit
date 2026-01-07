import { createServerClient } from "./supabase-server"

export class ProfileService {
    private supabase = createServerClient()

    async getProfile(userId: string) {
        const { data, error } = await this.supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
            console.error("Error fetching profile:", error)
        }
        return data
    }

    async createProfile(userId: string) {
        const { data, error } = await this.supabase
            .from('user_profiles')
            .insert({
                user_id: userId,
                traits: {},
                summary: "New User"
            })
            .select()
            .single()

        if (error) {
            console.error("Error creating profile:", error)
        }
        return data
    }

    async ensureProfile(userId: string) {
        if (!userId) return null

        let profile = await this.getProfile(userId)
        if (!profile) {
            console.log(`[ProfileService] Creating new profile for ${userId}`)
            profile = await this.createProfile(userId)
        }
        return profile
    }
}
