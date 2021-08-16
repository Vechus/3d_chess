const viewOrder = new Map([[0, "WHITE"],[1, "BLACK"],[2, "TOP"]])
const views = new Map([
    ['WHITE', [0, 11, 7]],
    ['BLACK', [0, 11, -7]],
    ['TOP', [0.001, 12, 0]]
]);

const CAMERA_TOP_OMEGA = 80;
const CAMERA_BOTTOM_OMEGA = 10;
const CAMERA_SPHERE_RADIUS = 14;

var keysPressed = {};


function enableScroll() {
    window.onscroll = function() {};
}

function disableScroll() {
    // Get the current page scroll position
    let scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
    let scrollLeft =
            window.pageXOffset || document.documentElement.scrollLeft;

        // if any scroll is attempted,
        // set this to the previous value
        window.onscroll = function () {
        window.scrollTo(scrollLeft, scrollTop);
    };
}

document.addEventListener('keydown', (e) => {
    keysPressed[e.key.toUpperCase()] = true;
    disableScroll();
});

document.addEventListener('keyup', (e) => {
    delete keysPressed[e.key.toUpperCase()];
    if(Object.keys(keysPressed).length === 0) enableScroll();
});

function computeCameraDiff() {
    camera_diff.x = 0;
    camera_diff.y = 0;
    for(const keyPressed of Object.keys(keysPressed)) {
        // use both WASD and arrow keys
        if (keyPressed === 'W' || keyPressed === 'ARROWUP') {
            // go up with camera
            camera_diff.y = -1;
        }
        if (keyPressed === 'A' || keyPressed === "ARROWLEFT") {
            // go left with camera
            camera_diff.x = 1;
        }
        if (keyPressed === 'S' || keyPressed === "ARROWDOWN") {
            // go down with camera
            camera_diff.y = 1;
        }
        if (keyPressed === 'D' || keyPressed === "ARROWRIGHT") {
            // go right with camera
            camera_diff.x = -1;
        }
    }
}

let currentIndex = 0;
function pickNextView() {
    return viewOrder.get(currentIndex++ % 4)
}

function pickView(n) {
    return viewOrder.get(n % 4);
}
