import { useState } from 'react'

/**
 * Returns a loadExample function that cycles through the provided examples
 * array on each call. Each example is an object of field values.
 * onLoad receives the selected example object.
 */
export function useRotatingExample(examples, onLoad) {
  const [index, setIndex] = useState(0)

  function loadExample() {
    onLoad(examples[index])
    setIndex(i => (i + 1) % examples.length)
  }

  return loadExample
}
