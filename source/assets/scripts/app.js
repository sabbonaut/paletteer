const Paletteer = require('./Paletteer.js')

function main () {
  let elements = {
    subpalettes: document.getElementById('subpalettes'),
    palette: document.getElementById('palette'),
    indicator: document.getElementById('indicator'),
    mode: document.getElementById('mode-toggler'),
    actions: {
      addColour: document.getElementById('add-colour'),
      removeColour: document.getElementById('remove-colour'),
      newPalette: document.getElementById('new-palette'),
      deletePalette: document.getElementById('delete-subpalette')
    },
    labels: [ document.getElementById('option-one-label'),
      document.getElementById('option-two-label'),
      document.getElementById('option-three-label')
    ],
    info: [ document.getElementById('option-one-value'),
      document.getElementById('option-two-value'),
      document.getElementById('option-three-value')
    ],
    sliders: [ document.getElementById('option-one-slider'),
      document.getElementById('option-two-slider'),
      document.getElementById('option-three-slider') ]
  }

  var paletteer = new Paletteer(elements)

  paletteer.start()
}

main()
