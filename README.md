# Virtual Pint Experience - MVP

Pour yourself a virtual pint! This fun, mobile-first web application simulates the experience of drinking a beer using your device's motion sensors. Tilt your phone to "drink" and watch the beer level go down, complete with a satisfying glug.

**Live Demo:** [Try it out!](https://beerisbest.vercel.app) (Assuming this is your Vercel URL)

## How It Works

1.  Visit the page on your mobile device.
2.  Grant permission for motion sensor access (if prompted).
3.  You'll see a classic Boston-style pint glass filled with a photographic-style virtual beer.
4.  Tilt your phone forward, as if taking a drink.
5.  The beer level in the glass will decrease, and the liquid surface will tilt realistically.
6.  A "glugging" sound will accompany the drinking action.

## Key Features

*   **Realistic Glass:** Styled to resemble a classic Boston/shaker pint glass.
*   **Photographic Beer:** Aims to use a photographic texture for the beer for a more visually appealing look.
*   **Interactive Drinking:** Utilizes device orientation (`DeviceOrientationEvent`) to detect forward tilt.
*   **Dynamic Visuals:**
    *   Beer level visibly drains from the glass.
    *   The surface of the beer tilts as you move your device.
*   **Auditory Feedback:** A "glugging" sound effect plays while "drinking".
*   **Mobile First:** Designed for a simple, engaging experience on mobile web browsers.
*   **Lightweight & Fast:** Built with standard HTML, CSS, and JavaScript for quick loading and interaction.

## Technologies Used

*   **HTML5:** For the page structure and audio element.
*   **CSS3:** For styling the glass, beer visuals, layout, and animations (height changes, transforms).
*   **JavaScript:** To handle:
    *   Device orientation sensor input.
    *   Updating beer level and liquid tilt.
    *   Controlling audio playback.
    *   User interaction (start button).

## Project Goal (MVP)

This Minimum Viable Product (MVP) aims to rapidly develop and validate the core concept of a virtual beer drinking experience with minimal development overhead. The focus is on the primary interaction: tilt-to-drink with visual and auditory feedback.

## Setup for Local Development (Optional)

1.  Clone the repository: `git clone https://github.com/b1rdmania/beerisbest.git`
2.  Navigate to the project directory: `cd beerisbest`
3.  Serve the `index.html` file over **HTTPS**. This is crucial because `DeviceOrientationEvent` and its permission model require a secure context.
    *   You can use tools like `live-server` with an HTTPS flag: `live-server --https=true` (if you have Node.js/npm and `live-server` installed).
    *   Alternatively, use `ngrok` to create an HTTPS tunnel to your local server.
4.  Open the provided HTTPS URL on your mobile device.

## Future Ideas (Beyond MVP)

*   More sophisticated liquid physics and animations.
*   Shake detection for foam effects.
*   Different drink types and glass styles.
*   A "refill" button.
*   Enhanced sound design. 