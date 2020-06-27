import { VuexModule } from 'vuex-module-decorators'
import { LocalSharedMutation, VLocalModule } from '@/utils/vuex-sugar'
import { merge } from '@/utils/object-utils'
import { Galo4ka, User } from '@/types/user'
import { getUserGalo4ki } from '@/api/user'

@VLocalModule('AuthModule')
export default class AuthModule extends VuexModule {
    user: User | null = null
    firebaseToken: string | null = null

    get authenticated (): boolean {
        return this.user !== null
    }

    get userGalo4ki (): Galo4ka[] {
        if (!this.user) return []

        return getUserGalo4ki(this.user)
    }

    @LocalSharedMutation()
    setUser (user: User | null): void {
        this.user = user
    }

    @LocalSharedMutation()
    setFirebaseToken (token: string | null): void {
        this.firebaseToken = token
    }

    @LocalSharedMutation()
    updateUser (user: Partial<User>): void {
        if (!this.user) {
            this.user = user as User
        } else {
            merge(this.user, user, ['sub', 'external_ids'])
            // merge won't handle them as intended.

            if (user.sub) {
                this.user.sub = user.sub
            }
            if (user.external_ids) {
                this.user.external_ids = user.external_ids
            }
        }
    }

    @LocalSharedMutation()
    logout (): void {
        this.user = null
    }
}
