module.exports = {
  assemble: (tagName, options) => {
    let element = document.createElement(tagName)

    if (options) {
      Object.keys(options).forEach((option, optionIndex) => {
        switch (option) {
          case 'classList':
            options.classList.forEach((className, classIndex) => {
              element.classList.add(className)
            })
            break

          case 'backgroundColor':
            element.style.backgroundColor = options.backgroundColor
            break

          case 'parentElement':
            options.parentElement.appendChild(element)
            break

          case 'on':
            Object.keys(options.on).forEach((on, onIndex) => {
              element.addEventListener(on, (event) => {
                options.on[on](event, element)
              })
            })
            break

          default:
            element[option] = options[option]
        }
      })
    }

    return element
  }
}
