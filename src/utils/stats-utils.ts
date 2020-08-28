import { formatISO } from "date-fns"

export function formatDate (date: Date): string {
    return formatISO(date, {
        representation: 'date'
    })
}
