
// =========================
// Playing with promises
// =========================
const myFirstPromise = new Promise((resolve, reject) => { 
  const condition = true;   
  if(condition) {
       setTimeout(function(){
           resolve("Promise is resolved!"); // fulfilled
      }, 300);
  } else {    
      reject('Promise is rejected!');  
  }
});


const helloPromise  = function() {
  return new Promise(function(resolve, reject) {
    const message = `Hi, How are you!`;

    resolve(message)
  });
}

const demoPromise= function() {

  myFirstPromise
  .then(helloPromise)
  .then((successMsg) => {
      console.log("Success:" + successMsg);
  })
  .catch((errorMsg) => { 
      console.log("Error:" + errorMsg);
  })
}

demoPromise();
















// ================================
// Private props and methods in js
// ================================
class Developer {
  name;
  #age; // Don't tell anyone my age!

  constructor(name, age) {
    this.name = name;
    this.#age = age;
  }
};

const David = new Developer('David', 38);

console.log(David.name); 
console.log(David.age);
console.log(David.#age);











// ================================
// Promise all
// ================================
const promise1 = Promise.resolve(3);
const promise2 = 42;
const promise3 = new Promise((resolve, reject) => {
  setTimeout(resolve, 100, 'foo');
});

Promise.all([promise1, promise2, promise3]).then((values) => {
  console.log(values);
});
// expected output: Array [3, 42, "foo"]