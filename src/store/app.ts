import { Mutation, VuexModule } from 'vuex-module-decorators'
import { VModule } from '@/utils/vuex-sugar'
import { merge } from '@/utils/object-utils'
import { DEBUG } from '@/utils/debug'

@VModule('AppModule')
export default class AppModule extends VuexModule {
    unsavedData = false
    pageTitle: string | null = null
    innerTitle: string | null = null
    navTitle: string | null = null
    showUpdateButton = false
    hideNavBar = false
    hideAppBar = false

    showSearch = false
    searchInput = ''

    loading = false

    @Mutation
    set<T extends keyof AppModule> (params: { key: T, value: AppModule[T] }): void {
        DEBUG.store('app.set(%s=%o)', params.key, params.value);
        (this as AppModule)[params.key] = params.value
    }

    @Mutation
    merge (params: Partial<AppModule>): void {
        DEBUG.store('app.merge()', params)
        merge(this, params)
    }

    @Mutation
    reset (params?: { keepSearch?: boolean }): void {
        // even though im into DRY, i couldnt find a way not to repeat these bois
        this.unsavedData = false
        this.pageTitle = null
        this.innerTitle = null
        this.navTitle = null
        this.showUpdateButton = false
        this.hideNavBar = false
        this.hideAppBar = false

        if (params?.keepSearch !== true) {
            this.showSearch = false
            this.searchInput = ''
        }
    }
}
