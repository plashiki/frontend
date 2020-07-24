// most of the code is taken from github.com/google/palette.js
// available under Apache 2.0 license
const poly = function (x: number, ...varargs: number[]) {
    let i = arguments.length - 1
    let n = arguments[i]
    while (i > 1) {
        n = n * x + arguments[--i]
    }
    return n
}

const rgb = (r: number, g: number, b: number): string => {
    return '#'
        + Math.round(r * 255).toString(16).padStart(2)
        + Math.round(g * 255).toString(16).padStart(2)
        + Math.round(b * 255).toString(16).padStart(2)
}

const tolRainbowColor = function (x: number) {
    return rgb(
        poly(x, 0.472, -0.567, 4.05) / poly(x, 1, 8.72, -19.17, 14.1),
        poly(x, 0.108932, -1.22635, 27.284, -98.577, 163.3, -131.395, 40.634),
        1 / poly(x, 1.97, 3.54, -68.5, 243, -297, 125)
    )
}

export const getPallete = (n: number): string[] => {
    let ret = []
    let step = 1 / n
    let k = 0
    for (let i = 0; i < n; i++) {
        ret.push(tolRainbowColor(k))
        k += step
    }
    return ret
}
