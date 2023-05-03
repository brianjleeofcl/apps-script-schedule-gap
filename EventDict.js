const availableCodeword = ['canceled', 'cancelled', 'not expected', 'n/a', 'do not have to tell them', 'can miss']

function checkAvailableCodeword(sentence) {
  return availableCodeword.some(code => {
    return sentence.toLowerCase().match(new RegExp(code, 'i'))
  })
}
