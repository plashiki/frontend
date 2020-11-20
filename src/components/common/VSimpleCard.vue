<template functional>
    <div
        :class="[
            data.class,
            data.staticClass,
            props.flat ? '' : 'elevation-3'
        ]"
        class="v-card v-simple-card"
        v-bind="data.attrs"
    >
        <div :class="props.textClass" class="v-card__text">
            <slot />
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

// smol qt functional wrapper for v-card coz why not

@Component({})
export default class VSimpleCard extends Vue {
    @Prop() textClass!: string
    @Prop({ type: Boolean, default: false }) flat!: boolean
}
</script>

<style>
/* idk why vuetify doesnt use something like this and instead puts theme--dark class directly to v-card. */
.v-application.theme--light .v-simple-card {
    background-color: #FFFFFF;
    color: rgba(0, 0, 0, 0.87);
}

.v-application.theme--dark .v-simple-card {
    background-color: #1E1E1E;
    color: #FFFFFF;
}

.v-application.theme--light .v-simple-card.v-card--outlined {
    border: thin solid rgba(0, 0, 0, 0.12);
}

.v-application.theme--dark .v-simple-card.v-card--outlined {
    border: thin solid rgba(255, 255, 255, 0.12);
}
</style>
