export type AnyKV = { [key: string]: any }
export type Leave<T, K extends keyof T> = {
    [P in keyof T]: P extends K ? T[P] : never
}

export interface IRecaptcha {
    execute (): Promise<string>
}
