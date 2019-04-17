// Initialize Firebase
var config = {
    apiKey: "AIzaSyB5GfW57iQSUMZLUWHbE-zJvzBpH8mQ5a0",
    authDomain: "train-tracker-a7270.firebaseapp.com",
    databaseURL: "https://train-tracker-a7270.firebaseio.com",
    projectId: "train-tracker-a7270",
    storageBucket: "train-tracker-a7270.appspot.com",
    messagingSenderId: "381064239855"
};

firebase.initializeApp(config);

var database = firebase.database();

// Add var to index trains
var trainIndex = 0;

// Button for adding train
$("#add-train-btn").on("click", function (event) {
    event.preventDefault();

    // Grab user input
    var nameInput = $("#train-name-input").val().trim();
    var destinationInput = $("#destination-input").val().trim();
    var firstTrainInput = $("#first-train-input").val().trim();
    var frequencyInput = $("#frequency-input").val().trim();

    // Create local "temporary" object to hold data
    var newTrain = {
        name: nameInput,
        destination: destinationInput,
        firstTrain: firstTrainInput,
        frequency: frequencyInput,
        index: trainIndex
    };

    // increment index
    trainIndex++;

    // Upload to database
    database.ref().push(newTrain);

    // clear text boxes
    $("#train-name-input").val("");
    $("#destination-input").val("");
    $("#first-train-input").val("");
    $("#frequency-input").val("");

});

// Create functions to convert from a time to minutes into day..
function timeToMinutes(time) {

    time = time.split(":");
    var minutes = parseInt(time[0]) * 60 + parseInt(time[1]);

    return minutes;
}

// .. And vice versa
function minutesToTime(minutes) {

    var minute = minutes % 60;
    var hour = (minutes - minute) / 60;

    if (minute < 10) {
        minute = "0" + minute;
    }
    if (hour < 10) {
        hour = "0" + hour;
    }

    var time = hour + ":" + minute;

    return time;
}

// Create function to find how long ago last train was
function lastTrain(trainFirst, frequency) {

    // Calculate next Train time and Minutes away
    var currentTime = moment();
	console.log("TCL: lastTrain -> currentTime", currentTime)
    var trainFirstConverted = moment(trainFirst, "HH:mm");
	console.log("TCL: lastTrain -> trainFirstConverted", trainFirstConverted)

    // Difference between times
    var diffTime = moment().diff(moment(trainFirstConverted), "minutes");
	console.log("TCL: lastTrain -> diffTime", diffTime)

    var minAway;

    // make sure current time is after first train
    if (diffTime > 0) {

        // last train came in (time difference modulo frequency) minutes ago
        var trainLast = diffTime % frequency;
		console.log("TCL: lastTrain -> trainLast", trainLast)

        // minutes away is difference between frequency and last time
        minAway = frequency - trainLast;
		console.log("TCL: lastTrain -> minAway", minAway)

        // arrival time is current time + minutes away. Then we convert to military time
        var arrivalTime = moment().add(minAway, "minutes");
		console.log("TCL: lastTrain -> arrivalTime", arrivalTime)

        // if arrival date is past midnight (day advances), train will arrive at start time tomorrow
        if (moment(arrivalTime, "HH:mm").date() > moment().date()) {
            arrivalTime = trainFirst;
            minAway = moment(arrivalTime, "HH:mm").diff(moment(), "minutes") + 1440;
        }

        // otherwise just change format to only show time
        else {
            arrivalTime = moment(arrivalTime).format("HH:mm");
        }

    }

    // if it is before current train, then arrival is first train
    else {
        arrivalTime = moment(trainFirstConverted).format("HH:mm");
        minAway = moment(arrivalTime, "HH:mm").diff(moment(), "minutes");
    }

    return [arrivalTime, minAway];

}

// Firebase event for adding trains to database
database.ref().on("child_added", function (childSnap) {
    console.log(childSnap.val());

    // store everything into variable
    var trainName = childSnap.val().name;
    var trainDest = childSnap.val().destination;
    var trainFirst = childSnap.val().firstTrain;
    var trainFreq = childSnap.val().frequency;
    var trainIndex = childSnap.val().index;

    // Call lastTrain function to learn arrival details
    var arrival = lastTrain(trainFirst, trainFreq);

    // create new row and add index to tag, and details
    var newRow = $("<tr>");
    newRow.attr("data-index", "train-" + trainIndex);
    newRow.append(
        $("<td>").text(trainName),
        $("<td>").text(trainDest),
        $("<td>").text(trainFreq),
        $("<td>").text(arrival[0]),
        $("<td>").text(arrival[1])
    );

    $("#train-table > tbody").append(newRow);

})