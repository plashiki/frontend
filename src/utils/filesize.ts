export function formatFileSize (bytes: number, decimal = 1): string {
    bytes = Math.abs(bytes)

    const radix = 1024
    const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

    let loop = 0

    // calculate
    while (bytes >= radix) {
        bytes /= radix
        ++loop
    }

    return `${bytes.toFixed(decimal)} ${units[loop]}`
}
