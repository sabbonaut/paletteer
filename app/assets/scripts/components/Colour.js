const remote = require('electron').remote
const {clipboard} = remote

const Conversion = require('./Conversion.js')
const Factory = require('./Factory.js')

class Colour {
  constructor (hsl) {
    this.hsl = [ (hsl) ? hsl[0] : (Math.round(Math.random() * 360)),
      (hsl) ? hsl[1] : 85.2,
      (hsl) ? hsl[2] : 54.9 ]
  }

  /**
   * * Build a colour element and it's supporting elements.
   */
  build (paletteer) {
    // * Assemble a colour element.
    this.element = Factory.assemble('li', {
      classList: ['colour'],
      draggable: true,
      backgroundColor: Conversion.hslToString(this.hsl),
      parentElement: paletteer.elements.palette,
      on: {
        click: (event, element) => {
          // * Only copy the code if colour is active.
          if (event.path[0].tagName === 'SPAN') {
            clipboard.writeText(event.path[0].textContent)

            event.path[0].classList.add('copied')

            setTimeout(() => {
              event.path[0].classList.remove('copied')
            }, 200)
          } else if (element === paletteer.colours[paletteer.current.colour].element) {
            switch (paletteer.options.mode) {
              case 0:
                let string = 'hsl(' + this.hsl[0].toString() + ', ' + this.hsl[1] + '%, ' + this.hsl[2] + '%)'

                clipboard.writeText(string)
                break

              case 1:
                clipboard.writeText(element.style.backgroundColor)
                break
            }

            paletteer.colours[paletteer.current.colour].element.classList.add('copied')

            setTimeout(() => {
              paletteer.colours[paletteer.current.colour].element.classList.remove('copied')
            }, 200)
          } else {
            this.switch(paletteer)
          }
        },
        dragstart: (event, element) => {
          paletteer.dragging = element

          setTimeout(() => {
            element.classList.add('invisible')
          }, 0)
        },
        dragend: (event, element) => {
          paletteer.dragging = null

          element.classList.remove('invisible')
        },
        dragover: (event) => {
          event.preventDefault()
        },
        drop: (event) => {
          if (paletteer.dragging.classList.contains('colour')) {
            let colourIndex

            paletteer.colours.forEach((colour, thisIndex) => {
              if (paletteer.dragging === colour.element) {
                colourIndex = thisIndex
              }
            })

            if (paletteer.dragging !== event.target) {
              let currentSubpalette = paletteer.elements.subpalettes.childNodes[paletteer.current.subpalette]

              paletteer.colours.forEach((colour, index) => {
                if (paletteer.dragging && event.target === colour.element) {
                  if (colourIndex > index) {
                    paletteer.elements.palette.insertBefore(paletteer.dragging, paletteer.elements.palette.childNodes[index])

                    currentSubpalette.insertBefore(currentSubpalette.childNodes[colourIndex], currentSubpalette.childNodes[index])

                    if (paletteer.current.colour === colourIndex) {
                      paletteer.current.colour = index
                    } else if ((paletteer.current.colour === index ||
                                index === paletteer.current.colour - 1) &&
                                paletteer.current.colour < paletteer.colours.length - 1) {
                      paletteer.current.colour++
                    }
                  } else {
                    paletteer.elements.palette.insertBefore(paletteer.dragging, paletteer.elements.palette.childNodes[index + 1])

                    currentSubpalette.insertBefore(currentSubpalette.childNodes[colourIndex], currentSubpalette.childNodes[index + 1])

                    if (paletteer.current.colour === colourIndex) {
                      paletteer.current.colour = index
                    } else if ((paletteer.current.colour === index ||
                        index === paletteer.current.colour + 1) &&
                        paletteer.current.colour > 0) {
                      paletteer.current.colour--
                    }
                  }

                  let thisColour = paletteer.colours[colourIndex]

                  paletteer.colours.splice(colourIndex, 1)
                  paletteer.colours.splice(index, 0, thisColour)

                  paletteer.update()
                  paletteer.dragging = null
                }
              })
            }

            paletteer.save()
          }
        }
      }
    })

    // * Convert the colour element's background colour to a hex code.
    let rgbValues = Conversion.stringToRgb(this.element.style.backgroundColor)
    let hexCode = Conversion.rgbToHex(rgbValues[0], rgbValues[1], rgbValues[2])

    // * Assemble a hex code element as a child of the colour element.
    Factory.assemble('span', {
      textContent: hexCode,
      parentElement: this.element
    })

    // * Assemble a subpalette element.
    this.subpaletteColour = Factory.assemble('div', {
      backgroundColor: Conversion.hslToString(this.hsl),
      parentElement: paletteer.subpalettes[paletteer.current.subpalette].element
    })

    paletteer.colours.push(this)

    paletteer.current.colour = paletteer.colours.length - 1

    this.rgb = Conversion.stringToRgb(paletteer.colours[paletteer.current.colour].element.style.backgroundColor)

    paletteer.update()

    paletteer.save()
  }

  switch (paletteer) {
    // * Update the current colour index.
    paletteer.colours.forEach((colour, index) => {
      if (this.element === colour.element) {
        paletteer.current.colour = index
      }
    })

    paletteer.update()
  }
}

module.exports = Colour
