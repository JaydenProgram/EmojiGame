import {
    HandLandmarker,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

document.addEventListener('DOMContentLoaded', init);

const demosSection = document.getElementById("demos");
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const healthBar = document.getElementById('healthBar');
const gameArea = document.querySelector('.gameArea');
const retryButton = document.getElementById('retryButton');
const gameOverScreen = document.getElementById('gameOverScreen');


let handLandmarker = undefined;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
let pose;
const spawnedEmojis = [];
let sortedResults;
let predictions;
let lastCircleSpawnTime = performance.now();
const emojiSpawnInterval = 1000;

let health = 100;


const nn = ml5.neuralNetwork({
    task: 'classification',
    debug: true,
    layers: [
        {
            type: 'dense',
            units: 16, // A little bit more simple
            activation: 'relu',
        },
        {
            type: 'dense',
            activation: 'softmax',
        },
    ]
});
const modelDetails = {
    model: 'model/model.json',
    metadata: 'model/model_meta.json',
    weights: 'model/model.weights.bin'
};

function init() {
    createHandLandmarker();

    const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

    if (hasGetUserMedia()) {
        enableWebcamButton = document.getElementById("webcamButton");
        enableWebcamButton.addEventListener("click", enableCam);
    } else {
        console.warn("getUserMedia() is not supported by your browser");
    }
    nn.load(modelDetails, () => console.log("Loaded model info"));
}

const createHandLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
        },
        runningMode: runningMode,
        numHands: 1
    });
    demosSection.classList.remove("invisible");
};

function enableCam(event) {
    if (!handLandmarker) {
        console.log("Wait! objectDetector not loaded yet.");
        return;
    }

    if (webcamRunning === true) {
        webcamRunning = false;
        enableWebcamButton.innerText = "ENABLE PREDICTIONS";
    } else {
        if (spawnedEmojis.length < 1) {
            for (let i = 0; i < 1; i++) {
                createEmoji();
            }
        }
        webcamRunning = true;
        enableWebcamButton.innerText = "DISABLE PREDICTIONS";
    }

    const constraints = {
        video: true
    };

    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
    });
}

let lastVideoTime = -1;
let results = undefined;

let canvasWidth;
let canvasHeight;

async function predictWebcam() {
    canvasElement.style.width = gameArea.offsetWidth + 'px';
    canvasElement.style.height = gameArea.offsetHeight + 'px';
    canvasElement.width = gameArea.offsetWidth;
    canvasElement.height = gameArea.offsetHeight;

    canvasWidth = canvasElement.width;
    canvasHeight = canvasElement.height;

    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await handLandmarker.setOptions({ runningMode: "VIDEO" });
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
            pose = landmarks.flatMap(coord => [coord.x, coord.y, coord.z]);

            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                color: "#FFD700",
                lineWidth: 20,

            });
            drawLandmarks(canvasCtx, landmarks, {
                color: "#DAA520",
                lineWidth: 5
            });

            const currentTime = performance.now();
            if (currentTime - lastCircleSpawnTime >= emojiSpawnInterval) {
                createEmoji();
                lastCircleSpawnTime = currentTime;
            }


            for (const emoji of spawnedEmojis) {
                const index = spawnedEmojis.indexOf(emoji);
                drawEmojis(emoji);

                emoji.y += emoji.dy;

                if (emoji.y - emoji.radius > canvasElement.height) {
                    let deleted = spawnedEmojis.splice(index, 1);
                    health -= 10;
                    healthBar.style.width = `${health}%`;
                    // Change the color of the health bar based on the health value
                    if (health > 70) {
                        healthBar.style.backgroundColor = 'green';
                    } else if (health > 30) {
                        healthBar.style.backgroundColor = 'yellow';
                    } else {
                        healthBar.style.backgroundColor = 'red';
                    }

                }
                if(!sortedResults) {
                    console.log('wwo')
                } else{

                    if (sortedResults[0].label === 'Fist') {
                        // Execute removal after a delay
                        setTimeout(() => {
                            // Check if the gesture is still the same after the delay
                            if (sortedResults[0].label === 'Fist') {
                                // Find the index of the first emoji with the label '✊'
                                const index = spawnedEmojis.findIndex(emoji => emoji.emoji === '✊');
                                if (index !== -1) {
                                    // Remove the emoji at the found index
                                    spawnedEmojis.splice(index, 1);
                                }
                            }
                        }, 250); // 1000 milliseconds delay (adjust as needed)
                    } else if (sortedResults[0].label === 'ThumbsUp') {
                        // Execute removal after a delay
                        setTimeout(() => {
                            // Check if the gesture is still the same after the delay
                            if (sortedResults[0].label === 'ThumbsUp') {
                                // Find the index of the first emoji with the label '👍'
                                const index = spawnedEmojis.findIndex(emoji => emoji.emoji === '👍');
                                if (index !== -1) {
                                    // Remove the emoji at the found index
                                    spawnedEmojis.splice(index, 1);
                                }
                            }
                        }, 250); // 1000 milliseconds delay (adjust as needed)
                    } else if (sortedResults[0].label === 'HandUp') {
                        // Execute removal after a delay
                        setTimeout(() => {
                            // Check if the gesture is still the same after the delay
                            if (sortedResults[0].label === 'HandUp') {
                                // Find the index of the first emoji with the label '🤚'
                                const index = spawnedEmojis.findIndex(emoji => emoji.emoji === '🤚');
                                if (index !== -1) {
                                    // Remove the emoji at the found index
                                    spawnedEmojis.splice(index, 1);
                                }
                            }
                        }, 250); // 1000 milliseconds delay (adjust as needed)
                    }
                }
            }
            const predictionsFragment = document.createDocumentFragment();
            predictions = await nn.classify(pose);
            sortedResults = predictions.sort((a, b) => b.confidence - a.confidence);

            sortedResults.forEach(prediction => {
                let p = document.createElement('p');
                p.innerText = `${prediction.label}: ${prediction.confidence}`;
                predictionsFragment.appendChild(p);
            });

            const predictionsElement = document.getElementById("predictions");
            predictionsElement.innerHTML = "";
            predictionsElement.appendChild(predictionsFragment);

            if (health === 0) {
                stopGame();
            }

        }
    }
    canvasCtx.restore();

    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}

function createEmoji() {
    const radius = Math.random() * 30 + 15;
    const x = Math.random() * (canvasElement.width - 2 * radius);
    const y = -radius;
    const dx = (Math.random() - 0.5) * 2;
    const dy = Math.random() * 2 + 1;

    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    spawnedEmojis.push({ x, y, radius, dx, dy, emoji });
}

const emojis = ["👍", "✊", "🤚"];

function drawEmojis(emoji) {
    canvasCtx.font = `${emoji.radius * 2}px Arial`;
    canvasCtx.fillStyle = emoji.color;
    canvasCtx.fillText(emoji.emoji, emoji.x - emoji.radius, emoji.y + emoji.radius / 2);
}

function stopGame() {
    webcamRunning = false;
    gameOverScreen.style.display = 'block';
}

retryButton.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    health = 100; // Reset health
    healthBar.style.width = `${health}%`; // Reset health bar width
    healthBar.style.backgroundColor = 'green'; // Reset health bar color
    webcamRunning = true; // Restart the game
    predictWebcam(); // Restart predictionsh
});