const listInitElevatorLocation = require('./listInitElevatorLocation');

test("listInitElevatorLocation: 1", () => {
    expect(listInitElevatorLocation(10, 10)).toStrictEqual([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test("listInitElevatorLocation: 2", () => {
    expect(listInitElevatorLocation(1, 1)).toStrictEqual([0]);
});

test("listInitElevatorLocation: 3", () => {
    expect(listInitElevatorLocation(100, 1)).toStrictEqual([0]);
});

test("listInitElevatorLocation: 4", () => {
    expect(listInitElevatorLocation(1, 3)).toStrictEqual([ 0, 0, 0]);
});

test("listInitElevatorLocation: 5", () => {
    expect(listInitElevatorLocation(10, 3)).toStrictEqual([ 0, 5, 9]);
});