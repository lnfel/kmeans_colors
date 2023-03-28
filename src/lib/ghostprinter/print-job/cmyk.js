function colorAverage(total, length) {
    return parseInt(total) / length
}

/**
 * Generate summary of CMYK with given kmeans_colors set
 * NOTE: This is an alternative way, `summary` function is preferred
 */
class CMYK {
    /**
     * @param {Array} kmeans_colors Array of dominant colors produced by kmeans_colors binary
     */
    constructor(kmeans_colors) {
        this.total = kmeans_colors.map((colorset) => {
            return colorset.map((color) => {
                return color.cmyk
            }).reduce((accumulator, cmyk) => {
                const accumulatorArray = accumulator.split(' ')
                const cmykArray = cmyk.split(' ')
                const c = parseInt(accumulatorArray[0], 10) + parseInt(cmykArray[0], 10)
                const m = parseInt(accumulatorArray[1], 10) + parseInt(cmykArray[1], 10)
                const y = parseInt(accumulatorArray[2], 10) + parseInt(cmykArray[2], 10)
                const k = parseInt(accumulatorArray[3], 10) + parseInt(cmykArray[3], 10)
                return `${c} ${m} ${y} ${k}`
            }, '0 0 0 0')
        })

        this.whiteSpace = kmeans_colors.map((colorset) => {
            const whiteFilter = colorset.filter((color) => {
                return color.color === '#ffffff'
            })
    
            return parseFloat(whiteFilter[0]?.percentage ?? 0)
        })

        this.coloredSpace = this.whiteSpace.map((whiteSpace) => {
            return 100 - whiteSpace
        })

        this.summary = this.total.map((cmykString, index) => {
            return {
                c: (colorAverage(cmykString.split(' ')[0], kmeans_colors[index].length) / 100) * (this.coloredSpace[index] / 100) * 100,
                m: (colorAverage(cmykString.split(' ')[1], kmeans_colors[index].length) / 100) * (this.coloredSpace[index] / 100) * 100,
                y: (colorAverage(cmykString.split(' ')[2], kmeans_colors[index].length) / 100) * (this.coloredSpace[index] / 100) * 100,
                k: (colorAverage(cmykString.split(' ')[3], kmeans_colors[index].length) / 100) * (this.coloredSpace[index] / 100) * 100,
            }
        })

        this.toPOJO = () => {
            return {
                total: this.total,
                whiteSpace: this.whiteSpace,
                coloredSpace: this.coloredSpace,
                summary: this.summary
            }
        }
    }
}

/**
 * Generate summary of CMYK with given kmeans_colors set
 * 
 * @param {Array} kmeans_colors Array of dominant colors produced by kmeans_colors binary
 * @returns {Object} CMYK object
 */
export const summary = async (kmeans_colors) => {
    const cmyk = {}

    cmyk['total'] = kmeans_colors.map((colorset) => {
        return colorset.map((color) => {
            return color.cmyk
        }).reduce((accumulator, cmyk) => {
            const accumulatorArray = accumulator.split(' ')
            const cmykArray = cmyk.split(' ')
            const c = parseInt(accumulatorArray[0], 10) + parseInt(cmykArray[0], 10)
            const m = parseInt(accumulatorArray[1], 10) + parseInt(cmykArray[1], 10)
            const y = parseInt(accumulatorArray[2], 10) + parseInt(cmykArray[2], 10)
            const k = parseInt(accumulatorArray[3], 10) + parseInt(cmykArray[3], 10)
            return `${c} ${m} ${y} ${k}`
        }, '0 0 0 0')
    })
    cmyk['whiteSpace'] = kmeans_colors.map((colorset) => {
        const whiteFilter = colorset.filter((color) => {
            return color.color === '#ffffff'
        })

        return parseFloat(whiteFilter[0]?.percentage ?? 0)
    })
    cmyk['coloredSpace'] = cmyk['whiteSpace'].map((whiteSpace) => {
        return 100 - whiteSpace
    })
    cmyk['summary'] = cmyk['total'].map((cmykString, index) => {
        return {
            c: (colorAverage(cmykString.split(' ')[0], kmeans_colors[index].length) / 100) * (cmyk['coloredSpace'][index] / 100) * 100,
            m: (colorAverage(cmykString.split(' ')[1], kmeans_colors[index].length) / 100) * (cmyk['coloredSpace'][index] / 100) * 100,
            y: (colorAverage(cmykString.split(' ')[2], kmeans_colors[index].length) / 100) * (cmyk['coloredSpace'][index] / 100) * 100,
            k: (colorAverage(cmykString.split(' ')[3], kmeans_colors[index].length) / 100) * (cmyk['coloredSpace'][index] / 100) * 100,
        }
    })

    return cmyk
}

export default {
    summary,
    CMYK
}