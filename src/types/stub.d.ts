declare module 'vuex-shared-mutations' {
    import { MutationPayload, Store } from 'vuex'

    export default function createMutationsSharer (options: CreateMutationsSharerOptions): (store: Store<any>) => void

    export interface SharedMutationStrategy {
        addEventListener (fn: Function): any

        share (data: any): any
    }

    class BuiltinSharedMutationStrategy implements SharedMutationStrategy {
        static available (): boolean

        addEventListener (fn: Function): any

        share (data: any): any
    }

    export class BroadcastChannelStrategy extends BuiltinSharedMutationStrategy {
        constructor (options?: { key?: string })
    }

    export class LocalStorageStratery extends BuiltinSharedMutationStrategy {
        constructor (options?: { key?: string, maxMessageLength?: number })
    }

    interface CreateMutationsSharerOptions {
        predicate?: string[] | ((mutation: MutationPayload, state: any) => boolean)
        strategy?: SharedMutationStrategy
    }
}

declare module 'querystring' {
    export function stringify (obj: object): string
}

declare module 'scrollparent' {
    export default function (node: Element): Element
}

declare module '*.yml' {
    export default class {
        [key: string]: any
    }
}

declare module '@/assets/authors.txt' {
    export const authors: string[]
}

declare module '*.svg' {
    import Vue from 'vue'
    export default Vue
}
