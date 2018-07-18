class Conversion {
  rgbToHsl (red, green, blue) {
    red /= 255; green /= 255; blue /= 255

    var max = Math.max(red, green, blue)
    var min = Math.min(red, green, blue)

    var hue = (max + min) / 2
    var saturation = (max + min) / 2
    var light = (max + min) / 2

    if (max === min) {
      hue = saturation = 0 // achromatic
    } else {
      var difference = max - min

      saturation = light > 0.5 ? difference / (2 - max - min) : difference / (max + min)

      switch (max) {
        case red:
          hue = (green - blue) / difference + (green < blue ? 6 : 0)
          break

        case green:
          hue = (blue - red) / difference + 2
          break

        case blue:
          hue = (red - green) / difference + 4
          break
      }

      hue /= 6
    }

    return [Math.round(hue * 360), parseFloat((saturation * 100).toFixed(1)), parseFloat((light * 100).toFixed(1))]
  }

  stringToRgb (rgb) {
    let rgbList = rgb.split('(')[1].split(')')[0].split(',')

    return [Number(rgbList[0]), Number(rgbList[1]), Number(rgbList[2])]
  }

  rgbToHex (r, g, b) {
    return '#' + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b)
  }

  componentToHex (c) {
    var hex = c.toString(16)

    return hex.length === 1 ? '0' + hex : hex
  }

  hslToString (hsl) {
    return 'hsl(' + hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%)'
  }
}

module.exports = new Conversion()
