const startButton = document.getElementById('startButton');
const startButtonContainer = document.getElementById('startButtonContainer');
const glassContainer = document.getElementById('glassContainer');
const beer = document.getElementById('beer');
const liquid = document.getElementById('liquid');
const drinkSound = document.getElementById('drinkSound');

const INITIAL_BEER_HEIGHT_PERCENT = 100; // Beer is initially 100% full
let currentBeerHeightPercent = INITIAL_BEER_HEIGHT_PERCENT;

// Tilt angle thresholds for drinking (adjust these based on testing)
const MIN_DRINK_TILT_ANGLE = 20; // Beta angle degrees to start "drinking"
const MAX_DRINK_TILT_ANGLE = 90;  // Beta angle degrees for "empty"

startButton.addEventListener('click', () => {
    startButtonContainer.style.display = 'none';
    glassContainer.style.display = 'flex';

    // Ensure initial beer height is set for logging
    beer.style.height = INITIAL_BEER_HEIGHT_PERCENT + '%'; 
    console.log('[DEBUG] Initial beer.style.height:', beer.style.height);
    console.log('[DEBUG] Initial offsetHeight - #beer:', beer.offsetHeight, 'px, #liquid:', liquid.offsetHeight, 'px');

    // Attempt to play and pause sound to "unlock" it for some browsers
    drinkSound.play().then(() => {
        drinkSound.pause();
    }).catch(error => {
        console.warn("Audio play unlock failed, user interaction might be strictly needed for sound.", error);
    });

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+ requires explicit permission
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                } else {
                    alert('Permission to access device orientation was denied.');
                }
            })
            .catch(error => {
                console.error("DeviceOrientationEvent.requestPermission error:", error);
                alert('Could not get permission for device orientation.');
            });
    } else if (typeof DeviceOrientationEvent !== 'undefined') {
        // For other browsers that don't require .requestPermission()
        // or for non-iOS 13+ devices.
        window.addEventListener('deviceorientation', handleOrientation);
    } else {
        alert('Device orientation not supported on this device/browser.');
    }
});

function handleOrientation(event) {
    // event.beta is the front-to-back tilt in degrees.
    // Positive beta when device is tilted towards the user (top edge away from user).
    // Negative beta when device is tilted away from user (top edge towards user - "drinking" motion).
    // We are interested in the "drinking" motion, but beta is often positive when tilted forward.
    // Let's assume a common interpretation:
    // Beta: 0 (flat), positive (tilting top towards user/screen up), negative (tilting top away from user/screen down).
    // However, the exact interpretation can vary slightly. For this MVP, we'll assume beta increases as the top of the phone is tilted *down* (as if drinking).
    // Test and adjust based on actual device behavior. Let's assume positive beta means tilting phone "forward to drink".

    let beta = event.beta; // Front-to-back tilt
    // let alpha = event.alpha; // Side-to-side, not used for now but good to remember
    // let gamma = event.gamma; // Also side-to-side tilt

    // Normalize beta for our purpose (0 when flat, up to 90 when tilted fully forward)
    // Clamp beta to our defined drinking range and ignore values outside it for height calculation.
    let betaForHeight = event.beta;
    if (betaForHeight < 0) betaForHeight = 0; // Ignore tilting backwards for height calculation

    let newHeightPercent;

    if (betaForHeight <= MIN_DRINK_TILT_ANGLE) {
        newHeightPercent = INITIAL_BEER_HEIGHT_PERCENT; // Not tilted enough, or tilted back
    } else if (betaForHeight >= MAX_DRINK_TILT_ANGLE) {
        newHeightPercent = 0; // Fully tilted, beer is empty
    } else {
        const tiltRange = MAX_DRINK_TILT_ANGLE - MIN_DRINK_TILT_ANGLE;
        const progressInTiltRange = (betaForHeight - MIN_DRINK_TILT_ANGLE) / tiltRange;
        newHeightPercent = INITIAL_BEER_HEIGHT_PERCENT * (1 - progressInTiltRange);
    }

    newHeightPercent = Math.max(0, Math.min(INITIAL_BEER_HEIGHT_PERCENT, newHeightPercent));

    if (currentBeerHeightPercent > 0 && newHeightPercent < currentBeerHeightPercent && newHeightPercent < (INITIAL_BEER_HEIGHT_PERCENT - 1) ) {
        if (drinkSound.paused) {
            drinkSound.play().catch(e => console.warn("Sound play failed:", e));
        }
    } else if (newHeightPercent === 0 || currentBeerHeightPercent === newHeightPercent) {
        if (!drinkSound.paused) {
            drinkSound.pause();
            drinkSound.currentTime = 0; // Reset sound if it stops
        }
    }

    currentBeerHeightPercent = newHeightPercent;
    beer.style.height = currentBeerHeightPercent + '%';
    console.log('[DEBUG] Updated offsetHeight - #beer:', beer.offsetHeight, 'px, #liquid:', liquid.offsetHeight, 'px');
    console.log('[DEBUG] Updated beer.style.height:', beer.style.height);

    // --- New Liquid Rotation Logic ---
    // Use the raw beta value for rotation to reflect actual device tilt.
    // Positive beta is assumed to be tilting forward (top of phone down).
    // So, liquid should rotate by -beta to appear level.
    let liquidRotation = -beta; 

    // Clamp the rotation to a visually reasonable range (e.g., -30 to +30 degrees)
    const MAX_LIQUID_ROTATION = 30;
    liquidRotation = Math.max(-MAX_LIQUID_ROTATION, Math.min(MAX_LIQUID_ROTATION, liquidRotation));

    // Apply the rotation to the #liquid div
    if (liquid) { // Ensure liquid element exists
        liquid.style.transform = `rotate(${liquidRotation}deg)`;
    }
} 