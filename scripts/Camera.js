const viewOrder = new Map([[0, "DEFAULT"],[1, "WHITE"],[2, "BLACK"],[3, "TOP"]])
const views = new Map([
    ['DEFAULT', [0, 6, 12]],
    ['WHITE', [0, 11, 7]],
    ['BLACK', [0, 11, -7]],
    ['TOP', [0, 12, 0]]
]);
let currentIndex = 0;
function pickNextView() {
    return viewOrder.get(currentIndex++ % 4)
}