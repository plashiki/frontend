import { eachDayOfInterval, formatISO } from 'date-fns'
import { StatisticsDay } from '@/types/misc'
import { getPallete } from '@/vendor/pallete'

export type RawStatistics = Record<string, number>
export type IndexedStatistics = Record<string, RawStatistics>

export function createIndexedStatistics (days: StatisticsDay[]): IndexedStatistics {
    let ret: IndexedStatistics = {}

    for (let obj of days) {
        ret[obj.day] = obj.data
    }

    return ret
}

export function formatDate (date: Date): string {
    return formatISO(date, {
        representation: 'date'
    })
}

export function daysInRange (rangeFrom: string, rangeTo: string): string[] {
    if (!rangeFrom || !rangeTo) return []
    return eachDayOfInterval({
        start: new Date(rangeFrom),
        end: new Date(rangeTo)
    }).map(i => formatDate(i))
}


export function getTrendForTypesInDateRange<T extends string> (days: string[], data: IndexedStatistics, types: T[]): Record<T, number[]> {
    let ret: Record<string, number[]> = {}
    let i = 0
    for (let day of days) {
        for (let type of types) {
            if (!(type in ret)) ret[type] = []
            ret[type].push(0)
        }

        const dayData = data[day] || {}
        for (let key of Object.keys(dayData)) {
            for (let type of types) {
                if (key.startsWith(type)) {
                    ret[type][i] += dayData[key]
                }
            }
        }

        i += 1
    }

    return ret
}

export interface SubtypeDistribution {
    labels: string[]
    data: number[]
    colors: string[]
}

export function getSubtypeDistributionForTypesInDateRange<T extends string> (
    days: string[],
    data: IndexedStatistics,
    types: T[]
): SubtypeDistribution {
    let obj: Record<string, number> = {}
    for (let day of days) {
        const dayData = data[day] || {}
        for (let key of Object.keys(dayData)) {
            for (let type of types) {
                if (key.startsWith(type + ':')) {
                    let subtype = key.split(':')[1]
                    if (!obj[subtype]) obj[subtype] = 0
                    obj[subtype] += dayData[key]
                }
            }
        }
    }

    let ret: SubtypeDistribution = {
        labels: [],
        data: [],
        colors: []
    }

    for (let [name, value] of Object.entries(obj)) {
        ret.labels.push(name)
        ret.data.push(value)
    }

    ret.colors = getPallete(ret.labels.length)

    return ret
}
