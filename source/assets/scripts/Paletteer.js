const remote = require('electron').remote
const {app} = remote

const filesystem = require('fs'); const path = require('path')

const Colour = require('./components/Colour.js')
const Subpalette = require('./components/Subpalette.js')
const Conversion = require('./components/Conversion.js')

const HSL = 0; const RGB = 1

class Paletteer {
  constructor (elements, options) {
    this.options = {
      mode: (options && options.mode) ? options.mode : 0,
      savefile: (options && options.savefile) ? path.join(app.getAppPath(), 'source', options.savefile) : path.join(app.getAppPath(), 'source', 'save.json')
    }
    this.current = {
      colour: 0,
      subpalette: 0
    }
    this.subpalettes = []
    this.colours = []
    this.dragging = null

    // * Check functions to conditionally run code.
    this.check = {
      current: {
        colour: (colourIndex) => {
          return (this.current.colour === colourIndex)
        },
        subpalette: (subpaletteIndex) => {
          return (this.current.subpalette === subpaletteIndex)
        }
      },
      delete: {
        colour: () => {
          return (this.colours.length > 1)
        },
        subpalette: () => {
          return (this.subpalettes.length > 1)
        }
      }
    }

    // * Remove functions to delete colours and subpalettes.
    this.remove = {
      colour: () => {
        if (this.check.delete.colour()) {
          // * Remove colour from the main palette.
          this.elements.palette.removeChild(this.colours[this.current.colour].element)

          let currentSubpalette = this.subpalettes[this.current.subpalette].element

          // * Remove colour from the current subpalette.
          currentSubpalette.removeChild(currentSubpalette.childNodes[this.current.colour])

          // * Remove the colour from the list of colours.
          this.colours.splice(this.current.colour, 1)

          // * Check for the current colour index being out of bounds.
          if (this.current.colour > 0) {
            this.current.colour--
          }

          // * Render the updated palette.
          this.update()

          // * Save the current state of Paletteer.
          this.save()
        }
      },
      subpalette: () => {
        if (this.check.delete.subpalette()) {
          let subpalettes = this.elements.subpalettes.childNodes

          subpalettes.forEach((subpalette, subpaletteIndex) => {
            if (this.check.current.subpalette(subpaletteIndex) &&
                this.check.delete.subpalette()) {
              // * Remove the current subpalette from the DOM.
              this.elements.subpalettes.removeChild(subpalette)

              // * Remove the current subpalette from the list of subpalettes.
              this.subpalettes.splice(subpaletteIndex, 1)

              // * Decrement the current subpalette if it's not first.
              if (this.current.subpalette > 0) {
                this.current.subpalette--
              }

              // * Switch to the new subpalette.
              this.subpalettes[this.current.subpalette].switch(this)
            }
          })

          // * Save the current state of Paletteer.
          this.save()
        }
      }
    }

    // * Connect functions to hook up input elements to Paletteer.
    this.connect = {
      /**
       * * Connect mode toggler to Paletteer.
       * @param {Element} mode The mode toggler.
       */
      mode: (mode) => {
        let buttons = []

        // * Iterate through the mode toggler and push all instances
        // * of buttons to the temporary buttons array.
        mode.childNodes.forEach((button, buttonIndex) => {
          if (button.tagName === 'BUTTON') {
            buttons.push(button)
          }
        })

        // * Iterate through the temporary buttons array and add click
        // * event listeners.
        buttons.forEach((button, buttonIndex) => {
          button.addEventListener('click', () => {
            if (!button.classList.contains('active')) {
              // * Remove all instances of the active class from buttons.
              buttons.forEach((currentButton, currentIndex) => {
                if (currentButton.classList.contains('active')) {
                  currentButton.classList.remove('active')
                }
              })

              // * Add the active class to the clicked button.
              button.classList.add('active')

              // * Set the current mode to the index of the button.
              this.currentMode = buttonIndex
            }
          })
        })
      },
      /**
       * * Connect sliders to the current colour.
       * @param {Element} sliders The sliders hook into.
       */
      sliders: (sliders) => {
        let self = this

        sliders.forEach((slider, sliderIndex) => {
          slider.oninput = function () {
            let nodeWidth = (100 / self.colours.length).toPrecision(5)

            let background = ''

            let activeColour = self.colours[self.current.colour]
            let activeSubpalette = self.subpalettes[self.current.subpalette]

            switch (self.options.mode) {
              case HSL:
                activeColour.hsl[sliderIndex] = Number(this.value)

                background = 'hsl(' + activeColour.hsl[0] + ',' + activeColour.hsl[1] + '%,' + activeColour.hsl[2] + '%)'

                let list = Conversion.stringToRgb(activeColour.element.style.backgroundColor)

                activeColour.rgb = list

                activeColour.element.childNodes[0].textContent = Conversion.rgbToHex(activeColour.rgb[0], activeColour.rgb[1], activeColour.rgb[2])

                self.elements.info.forEach((info, infoIndex) => {
                  if (sliderIndex === infoIndex) {
                    switch (sliderIndex) {
                      case 0:
                        info.textContent = this.value
                        break

                      default:
                        info.textContent = this.value + '%'
                    }
                  }
                })
                break

              case RGB:
                activeColour.rgb[sliderIndex] = Number(this.value)

                activeColour.hsl = Conversion.rgbToHsl(activeColour.rgb[0], activeColour.rgb[1], activeColour.rgb[2])

                background = 'rgb(' + activeColour.rgb[0] + ',' + activeColour.rgb[1] + ',' + activeColour.rgb[2] + ')'

                activeColour.element.childNodes[0].textContent = Conversion.rgbToHex(activeColour.rgb[0], activeColour.rgb[1], activeColour.rgb[2])

                self.elements.info.forEach((info, infoIndex) => {
                  if (sliderIndex === infoIndex) {
                    info.textContent = this.value
                  }
                })
                break
            }

            activeColour.element.setAttribute('style', 'background: ' + background + '; width: ' + nodeWidth + '%')

            activeSubpalette.element.childNodes[self.current.colour].setAttribute('style', 'background: ' + background + '; width: ' + nodeWidth + '%')
          }

          slider.addEventListener('change', () => {
            self.save()
          })
        })
      },
      /**
       * * Connect action buttons to Paletteer.
       * @param {object} actions { newPalette,
       *                           removeColour,
       *                           addColour } contain a dom element.
       */
      actions: (actions) => {
        // * Creating a new subpalette.
        actions.newPalette.addEventListener('click', () => {
          this.initialise()
        })

        // * Removing the current colour.
        actions.removeColour.addEventListener('click', () => {
          this.remove.colour()
        })

        // * Adding a new colour.
        actions.addColour.addEventListener('click', () => {
          let newColour = new Colour()
          newColour.build(this)
        })

        // * Deleting a subpalette.
        actions.deletePalette.addEventListener('click', () => {
          this.remove.subpalette()
        })
      }
    }

    // * Hook up input elements.
    if (elements) {
      this.elements = elements

      if (this.elements.actions) {
        this.connect.actions(this.elements.actions)
      }

      if (this.elements.mode) {
        this.connect.mode(this.elements.mode)
      }

      if (this.elements.sliders) {
        this.connect.sliders(this.elements.sliders)
      }
    }
  }

  get currentMode () {
    return this.options.mode
  }

  set currentMode (mode) {
    switch (mode) {
      case HSL:
        if (this.elements.sliders[0].classList.contains('invisible')) {
          for (let i = 0; i < 3; i++) {
            this.elements.sliders[i].classList.remove('invisible')
            this.elements.labels[i].classList.remove('hidden')
            this.elements.info[i].classList.remove('hidden')
          }
        }

        this.elements.sliders[0].classList.remove('red')
        this.elements.sliders[1].classList.remove('green')
        this.elements.sliders[2].classList.remove('blue')

        // * Set timeout to allow transition animation to play out.
        setTimeout(() => {
          this.elements.sliders[0].classList.add('hue')
          this.elements.sliders[1].classList.add('saturation')
          this.elements.sliders[2].classList.add('light')

          this.elements.labels[0].textContent = 'Hue'
          this.elements.labels[1].textContent = 'Saturation'
          this.elements.labels[2].textContent = 'Light'

          let list = this.colours[this.current.colour].hsl

          this.elements.info[0].textContent = list[0]
          this.elements.info[1].textContent = list[1] + '%'
          this.elements.info[2].textContent = list[2] + '%'

          this.elements.sliders.forEach((slider, sliderIndex) => {
            if (sliderIndex === 0) {
              slider.max = 360
            } else {
              slider.max = 100
              slider.step = 0.1
            }

            slider.value = list[sliderIndex]
          })
        }, 120)
        break

      case RGB:
        if (this.elements.sliders[0].classList.contains('invisible')) {
          for (let i = 0; i < 3; i++) {
            this.elements.sliders[i].classList.remove('invisible')
            this.elements.labels[i].classList.remove('hidden')
            this.elements.info[i].classList.remove('hidden')
          }
        }

        this.elements.sliders[0].classList.remove('hue')
        this.elements.sliders[1].classList.remove('saturation')
        this.elements.sliders[2].classList.remove('light')

        // * Set timeout to allow transition animation to play out.
        setTimeout(() => {
          this.elements.sliders[0].classList.add('red')
          this.elements.sliders[1].classList.add('green')
          this.elements.sliders[2].classList.add('blue')

          this.elements.labels[0].textContent = 'Red'
          this.elements.labels[1].textContent = 'Green'
          this.elements.labels[2].textContent = 'Blue'

          let splitString = this.colours[this.current.colour].element.style.backgroundColor.split('(')[1].split(')')[0].split(',')
          let list = [Number(splitString[0]), Number(splitString[1]), Number(splitString[2])]

          this.elements.info[0].textContent = list[0]
          this.elements.info[1].textContent = list[1]
          this.elements.info[2].textContent = list[2]

          this.elements.sliders.forEach((slider, sliderIndex) => {
            slider.max = 255
            slider.value = list[sliderIndex]
            slider.step = 1
          })
        }, 120)
        break
    }

    this.options.mode = mode
  }

  initialise () {
    this.clear()

    // * Create a new subpalette.
    let newSubpalette = new Subpalette()
    newSubpalette.build(this)

    // * Add a new colour.
    let newColour = new Colour()
    newColour.build(this)

    this.save()
  }

  clear () {
    // * Clear the main palette.
    while (this.elements.palette.firstChild) {
      this.elements.palette.removeChild(this.elements.palette.firstChild)
    }

    // * Clear the list of palette colours.
    this.colours = []
  }

  start () {
    filesystem.readFile(this.options.savefile, 'utf-8', (failed, data) => {
      if (failed) {
        // * Start a new palette.
        this.initialise()
      } else {
        // * Load saved palettes.
        let palettes = JSON.parse(data)

        // * Iterate through the list of saved palettes.
        palettes.forEach((palette, index) => {
          // * Clear the main palette.
          this.clear()

          // * Set the current subpalette index to the new subpalette index.
          this.current.subpalette = this.subpalettes.length

          // * Build a new subpalette.
          let newSubpalette = new Subpalette()
          newSubpalette.build(this)

          // * Iterate through the current subpalette's colours.
          palette.forEach((colour, index) => {
            // * Add the current iteration to the main palette.
            let newColour = new Colour(colour)
            newColour.build(this)
          })
        })
      }
    })
  }

  save () {
    let subpalettes = []

    // * Generate colour lists and push them to the subpalettes array.
    this.subpalettes.forEach((subpalette, subpaletteIndex) => {
      let colours = []

      subpalette.element.childNodes.forEach((colour, colourIndex) => {
        let rgbValues = Conversion.stringToRgb(colour.style.backgroundColor)

        let hslValues = Conversion.rgbToHsl(rgbValues[0], rgbValues[1], rgbValues[2])

        colours.push(hslValues)
      })

      subpalettes.push(colours)
    })

    // * Create the data string to save out to a file.
    let data = JSON.stringify(subpalettes)

    // * Save the data string to the save file.
    filesystem.writeFile(this.options.savefile, data, (error) => {
      if (error) {
        console.log(error)
      }
    })
  }

  update () {
    let colourWidth = (100 / this.colours.length).toPrecision(5)
    let activeColour = this.colours[this.current.colour]

    // * Set the indicator's position to the active colour.
    this.elements.indicator.setAttribute('style', 'left: ' + ((colourWidth / 2) + (colourWidth * this.current.colour)).toString() + '%')

    // * Change the width of each colour in the palette.
    this.elements.palette.childNodes.forEach((colour, colourIndex) => {
      if (colour.tagName === 'LI') {
        colour.style.width = colourWidth.toString() + '%'
      }
    })

    // * Change the width of each colour in the subpalette.
    this.subpalettes[this.current.subpalette].element.childNodes.forEach((colour, colourIndex) => {
      colour.style.width = colourWidth.toString() + '%'
    })

    // * Change the values of the sliders.
    this.elements.sliders.forEach((slider, sliderIndex) => {
      let sliderInfo = this.elements.info[sliderIndex]

      switch (this.currentMode) {
        case HSL:
          slider.value = activeColour.hsl[sliderIndex]

          if (sliderIndex === 0) {
            sliderInfo.textContent = activeColour.hsl[sliderIndex]
          } else {
            sliderInfo.textContent = activeColour.hsl[sliderIndex] + '%'
          }
          break

        case RGB:
          slider.value = activeColour.rgb[sliderIndex]

          sliderInfo.textContent = activeColour.rgb[sliderIndex]
          break
      }
    })
  }
}

module.exports = Paletteer
