class Queue {
    #capacity
    #queue = []
  
    constructor(capacity = Infinity) {
      this.#capacity = capacity
    }
  
    // Fundamental Methods
  
    enqueue(...items) {
      if (this.#queue.length + [...items].length > this.#capacity)
        throw new Error("Overflow!")
      this.#queue.push(...items)
    }
  
    dequeue() {
      if (this.#queue.length === 0) throw new Error("Underflow!")
      return this.#queue.shift()
    }
  
    front() {
      return this.#queue[0]
    }
  
    // Helper Methods
  
    back() {
      return this.#queue[this.#queue.length - 1]
    }
  
    length() {
      return this.#queue.length
    }
  
    isEmpty() {
      return this.#queue.length === 0
    }
  
    isFull() {
      return this.#queue.length === this.#capacity
    }
  
    display() {
      let queueString = "Front | "
  
      for (let item of this.#queue) {
        queueString += `${item} `
      }
  
      queueString += "| Back"
  
      console.log(queueString)
    }
  
    reverse() {
      this.#queue = this.#queue.reverse()
    }
  
    reverseFirst(n) {
      let tempFirst = this.#queue.slice(n)
      let tempSecond = this.#queue.slice(n + 1, -1)
  
      this.#queue = [...tempFirst.reverse(), ...tempSecond]
    }
  }
  
  export default Queue