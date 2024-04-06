# Real-Time Hand Gesture Recognition Game

## Overview

This project implements a real-time hand gesture recognition application using AI and machine learning techniques. The application captures pose data from a webcam, processes it using pose detection models, and classifies the detected gestures in real-time. The project shows how pose detection can be used to play basic games like falling emojis for example.

## Features

- **Webcam Integration**: Enables real-time capture of pose data from a webcam.
- **Pose Detection**: Utilizes MediaPose for hand pose detection from captured webcam frames.
- **Neural Network Model**: Implements a neural network model for classifying hand gestures based on pose data.
- **User Interface**: Easy to play game with start button and retry/end screen.
- **Emoji Spawning**: Features emoji spawning in canvas, you will have to use hand gestures to delete them and survive.
- **End**: If alot of emojis fall to the ground the game will end.

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/JaydenProgram/EmojiGame.git
   ```
2. Navigate to the project directory:
   ```
   cd EmojiGame
   ```
3. Open `index.html` in a web browser to launch the application.

## Usage

- Upon launching the application, click on the "Start Scanning" button to enable the webcam.
- Perform hand gestures in front of the webcam, and observe the real-time predictions displayed on the interface.
- Use the hand gestures to delete emojis based on what emoji is shown on the canvas

- Training model is included in `neurNetwork.html`

## Dependencies

- [MediaPipe](https://mediapipe.dev/): Used for hand pose detection.
- [ml5.js](https://ml5js.org/): JavaScript library for machine learning.
- [JavaScript ES6+](https://developer.mozilla.org/en-US/docs/Web/JavaScript): Language used for application development.
- [HTML5/CSS3](https://www.w3.org/standards/webdesign/htmlcss): Used for creating the user interface.

## License

This project is licensed under the [MIT License](LICENSE).
