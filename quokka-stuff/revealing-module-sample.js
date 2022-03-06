// We write the whole logic as private members
// and expose an anonymous object that maps the
// methods we want as their public counterparts
let fruitsCollection = (() => {
    // private
    let objects = [];
 
    const addObject = (object) => {
        objects.push(object);
    }
 
    const removeObject = (object) => {
        let index = objects.indexOf(object);
        if (index >= 0) {
            objects.splice(index, 1);
        }
    }
 
    const getObjects = () => JSON.parse(JSON.stringify(objects))
 
    // public
    return {
        addName: addObject,
        removeName: removeObject,
        getNames: getObjects
    };
})();
 
fruitsCollection.addName("Bob");
fruitsCollection.addName("Alice");
fruitsCollection.addName("Frank");
 
// prints: ["Bob", "Alice", "Frank"]
console.log(namesCollection.getNames());
 
namesCollection.removeName("Alice");
 
// prints: ["Bob", "Frank"]
console.log(namesCollection.getNames());