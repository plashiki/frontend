import { Vue, Component } from 'vue-property-decorator'

@Component({})
export class Passthru extends Vue {
    render() {
        return this.$scopedSlots.default!(this.$attrs)
    }
}
