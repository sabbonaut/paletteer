const Colour = require('./Colour.js')
const Conversion = require('./Conversion.js')
const Factory = require('./Factory.js')

class Subpalette {
  build (paletteer) {
    // * Assemble a subpalette element.
    this.element = Factory.assemble('div', {
      classList: ['subpalette'],
      draggable: true,
      on: {
        click: () => {
          // * Switch to this palette when it is clicked.
          this.switch(paletteer)
        },
        dragstart: () => {
          // * Let Paletteer know this element is being dragged.
          paletteer.dragging = this.element

          // * Set this element to invisible after the drag has started.
          setTimeout(() => {
            this.element.classList.add('invisible')
          }, 0)
        },
        dragend: () => {
          // * Let Paletteer know this element is done being dragged.
          paletteer.dragging = null

          // * Make this element visible when done dragging.
          this.element.classList.remove('invisible')
        },
        dragover: (event) => {
          event.preventDefault()
        },
        drop: (event) => {
          if (paletteer.dragging.classList.contains('subpalette')) {
            let subpaletteIndex

            paletteer.subpalettes.forEach((subpalette, thisIndex) => {
              if (paletteer.dragging === subpalette.element) {
                subpaletteIndex = thisIndex
              }
            })

            if (paletteer.dragging !== event.path[1]) {
              paletteer.subpalettes.forEach((subpalette, index) => {
                if (paletteer.dragging && event.path[1] === subpalette.element) {
                  if (subpaletteIndex > index) {
                    paletteer.elements.subpalettes.insertBefore(paletteer.dragging, paletteer.elements.subpalettes.childNodes[index])
                  } else {
                    paletteer.elements.subpalettes.insertBefore(paletteer.dragging, paletteer.elements.subpalettes.childNodes[index + 1])
                  }

                  let thisSubpalette = paletteer.subpalettes[subpaletteIndex]

                  paletteer.subpalettes.splice(subpaletteIndex, 1)
                  paletteer.subpalettes.splice(index, 0, thisSubpalette)

                  if (paletteer.current.subpalette === subpaletteIndex) {
                    paletteer.current.subpalette = index
                  } else if (paletteer.current.subpalette === index) {
                    paletteer.current.subpalette = subpaletteIndex
                  }

                  paletteer.dragging = null
                }
              })
            }

            paletteer.save()
          }
        }
      }
    })

    // * Add this subpalette to the DOM.
    paletteer.elements.subpalettes.appendChild(this.element)

    // * Set this subpalette to be the current.
    paletteer.current.subpalette = paletteer.subpalettes.length

    // * Push this subpalette to the list of subpalettes.
    paletteer.subpalettes.push(this)
  }

  switch (paletteer) {
    // * Clear the referenced instance of paletteer.
    paletteer.clear()

    // * Set the current subpalette to this subpalette.
    paletteer.subpalettes.forEach((subpalette, subpaletteIndex) => {
      if (this.element === subpalette.element) {
        paletteer.current.subpalette = subpaletteIndex
      }
    })

    let colours = []

    // * Push this subpalette's colours to the colours array.
    this.element.childNodes.forEach((childNode, childIndex) => {
      let rgbValues = Conversion.stringToRgb(childNode.style.backgroundColor)

      let hslValues = Conversion.rgbToHsl(rgbValues[0], rgbValues[1], rgbValues[2])

      colours.push(hslValues)
    })

    // * Clear this subpalette's colours.
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild)
    }

    // * Add this subpalette's colours to the main palette.
    colours.forEach((colour, valueIndex) => {
      let newColour = new Colour(colour)

      newColour.build(paletteer)
    })
  }
}

module.exports = Subpalette
