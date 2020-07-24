import { Vue, Watch } from 'vue-property-decorator'
import { appStore } from '@/store'

export default class LoadableVue extends Vue {
    loading = false

    @Watch('loading')
    private _onLoadingChange (val: boolean, oldVal: boolean): void {
        if (val === oldVal) return
        appStore.set({ key: 'loading', value: val })
    }
}
