import {HandLandmarker, FilesetResolver} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

document.addEventListener('DOMContentLoaded', init);

let handLandmarker = undefined;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
let data = [];

let importedTrainingData;

let lastVideoTime = -1;
let results = undefined;

let networkPredictions = document.getElementById('predictions')

let trainingStarted = false;
let label = '';
let pose;
let modelReady = false;

let labelInput = document.getElementById('label')
let trainingButton = document.getElementById('trainingButton')
let predictPose = document.getElementById('predictPose')
let importButton = document.getElementById('importData')
let saveModel = document.getElementById('saveModel')
let video = document.getElementById("webcam");
let canvasElement = document.getElementById("output_canvas");
let canvasCtx = canvasElement.getContext("2d");

const nn = ml5.neuralNetwork({
    task: 'classification',
    debug: true,
    layers: [
        {
            type: 'dense',
            units: 16, // Reduce the number of units to simplify the model
            activation: 'relu',
        },
        {
            type: 'dense',
            activation: 'softmax',
        },
    ]
});
function init() {
    createHandLandmarker();

    const hasGetUserMedia = () => {
        let _a;
        return !!((_a = navigator.mediaDevices) === null || _a === void 0 ? void 0 : _a.getUserMedia);
    };

    if (hasGetUserMedia()) {
        enableWebcamButton = document.getElementById("webcamButton");
        enableWebcamButton.addEventListener("click", enableCam);
    } else {
        console.warn("getUserMedia() is not supported by your browser");
    }


    trainingButton.addEventListener('click', startTraining);
    importButton.addEventListener('click', fetchData);
    predictPose.addEventListener('click', makePrediction);

    saveModel.addEventListener('click', function () {
        nn.save("model", () => console.log("model was saved!"))
    });
}

const createHandLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
        },
        runningMode: runningMode,
        numHands: 1
    });
};


function enableCam(event) {
    if (!handLandmarker) {
        console.log("Wait! objectDetector not loaded yet.");
        return;
    }
    if (webcamRunning === true) {
        webcamRunning = false;
        enableWebcamButton.innerText = "Start Scannen";
    } else {
        webcamRunning = true;
        enableWebcamButton.innerText = "Stop Scannen";
    }

    const constraints = {
        video: true
    };

    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
    });
}


async function predictWebcam() {
    canvasElement.style.width = video.videoWidth;
    canvasElement.style.height = video.videoHeight;
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;

    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await handLandmarker.setOptions({runningMode: "VIDEO"});
    }

    let startTimeMs = performance.now();
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        results = handLandmarker.detectForVideo(video, startTimeMs);
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    if (results.landmarks) {

        for (const landmarks of results.landmarks) {

            const coordinatesArray = landmarks.flatMap(coord => [coord.x, coord.y, coord.z]);
            pose = coordinatesArray;

            if (trainingStarted) {
                const trainingObject = ({
                    pose: coordinatesArray,
                    label: labelInput.value
                });

                data.push(trainingObject);

                localStorage.setItem('training', JSON.stringify(data));

                console.log(trainingObject);
            }

            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                color: "#01ffff",
                lineWidth: 1
            });
            drawLandmarks(canvasCtx, landmarks, {color: "#00c5ff", lineWidth: 1});

            if (modelReady) {
                let fragment = document.createDocumentFragment();

                let predictions = await nn.classify(pose);
                let sortedResults = predictions.sort((a, b) => b.confidence - a.confidence);

                sortedResults.forEach(prediction => {
                    let p = document.createElement('p');
                    p.innerText = `${prediction.label}: ${prediction.confidence}`;
                    fragment.appendChild(p);
                });

                networkPredictions.innerHTML = '';
                networkPredictions.appendChild(fragment);
            }
        }
    }
    canvasCtx.restore();
    // Call this function again to keep predicting when the browser is ready.
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}

function startTraining() {
    console.log(trainingStarted)

    if (!trainingStarted) {
        if (labelInput.value !== '') {
            label = labelInput.value
            trainingButton.innerHTML = 'Stop Training'
            trainingStarted = true;
        } else {
            trainingButton.innerHTML = 'Start Training'
            trainingStarted = false;
        }
    } else {
        trainingStarted = false;
        trainingButton.innerHTML = 'Start Training'
    }
}

async function fetchData() {
    try {
        const response = await fetch('nnData.json'); // Fetch pointing.json
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        importedTrainingData = await response.json();

        importedTrainingData = importedTrainingData.toSorted(() => (Math.random() - 0.5))

        const train = importedTrainingData.slice(0, Math.floor(importedTrainingData.length * 0.8))
        const test = importedTrainingData.slice(Math.floor(importedTrainingData.length * 0.8) + 1)


        console.log(importedTrainingData);

        train.forEach(entry => {
            const coordinates = entry.pose;
            const label = entry.label;
            nn.addData(coordinates, {label});
        });

        startTrainingNN(train, test)

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function startTrainingNN(train, test) {
    nn.normalizeData()

    nn.train({epochs: 20}, () => finishedTraining(test))
}

async function finishedTraining(testData) {
    importButton.innerHTML = 'Done!';
    console.log("Finished training!");
    modelReady = true;

    let correctPredictions = 0;

    // Make predictions on test data
    for (const testEntry of testData) {
        const prediction = await nn.classify(testEntry.pose);
        console.log(`Predicted: ${prediction[0].label}, Actual: ${testEntry.label}`);

        if (prediction[0].label === testEntry.label) {
            correctPredictions++;
        }
    }

    // Calculate accuracy
    const accuracy = (correctPredictions / testData.length) * 100;
    console.log(`Accuracy: ${accuracy.toFixed(2)}%`);
}

async function makePrediction() {
    const results = await nn.classify(pose)
    console.log(results)
}