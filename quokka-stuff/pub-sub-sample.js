let publisherSubscriber = {};
 
// We pass an object to the container to manage subscriptions
((container) => {
    // the id represents a subscription to the topic
    let id = 0;
 
    // the objects will subscribe to a topic by
    // sending a callback to be executed when
    // the event is fired
    container.subscribe = (topic, f) => {
        if (!(topic in container)) {
            container[topic] = [];
        }
 
        container[topic].push({
            'id': ++id,
            'callback': f
        });
 
        return id;
    }
 
    // Every subscription has it's own id, we will
    // use it to remove the subscription
    container.unsubscribe = (topic, id) => {
        let subscribers = [];
        for (car subscriber of container[topic]) {
             if (subscriber.id !== id) {
                subscribers.push(subscriber);
            }
        }
        container[topic] = subscribers;
    }
    container.publish = (topic, data) => {
        for (var subscriber of container[topic]) {
            // when we execute a callback it is always
            // good to read the documentation to know which
            // arguments are passed by the object firing
            // the event
            subscriber.callback(data);
        }
    }
})(publisherSubscriber);
 
let subscriptionID1 = publisherSubscriber.subscribe("mouseClicked", (data) => {
    console.log("mouseClicked, data: " + JSON.stringify(data));
});
let subscriptionID2 = publisherSubscriber.subscribe("mouseHovered", function(data) {
    console.log("mouseHovered, data: " + JSON.stringify(data));
});
let subscriptionID1 = publisherSubscriber.subscribe("mouseClicked", function(data) {
    console.log("second mouseClicked, data: " + JSON.stringify(data));
});
 
// When we publish an event, all callbacks should
// be called and you will see three logs
publisherSubscriber.publish("mouseClicked", {"data": "data1"});
publisherSubscriber.publish("mouseHovered", {"data": "data2"});
 
// We unsubscribe an event
publisherSubscriber.unsubscribe("mouseClicked", subscriptionID3);
 
// now we have 2 logs
publisherSubscriber.publish("mouseClicked", {"data": "data1"});
publisherSubscriber.publish("mouseHovered", {"data": "data2"});