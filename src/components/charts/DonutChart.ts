import { Doughnut } from 'vue-chartjs'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { ChartData, ChartOptions } from 'chart.js'

@Component({
    extends: Doughnut
})
export default class DonutChart extends Vue {
    renderChart!: (chartData: ChartData, options?: ChartOptions) => void

    @Prop() data!: ChartData
    @Prop({ default: undefined }) options?: ChartOptions

    @Watch('data')
    @Watch('options', { deep: true })
    draw () {
        this.renderChart(this.data, this.options)
    }

    mounted () {
        this.draw()
    }
}
