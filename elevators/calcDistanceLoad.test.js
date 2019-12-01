const lib = require('./calcDistanceLoad');

test("calcDistanceLoad: 1", () => {
    expect(lib.calcDistanceLoad([[5,"-"], [6,"-"]], 3, 7, "up",0, 4)).toStrictEqual([ 7, 0 , 2]);
});
test("calcDistanceLoad: 2", () => {
    expect(lib.calcDistanceLoad([[5,"-"], [3,"-"]], 6, 7, "down",0, 4)).toStrictEqual([ 10, 0 , 2]);
});
test("calcDistanceLoad: 3", () => {
    expect(lib.calcDistanceLoad([[5,"-"], [6,"-"]], 3, 2, "up",0, 4)).toStrictEqual([ 10, 0 ,2]);
});
test("calcDistanceLoad: 4", () => {
    expect(lib.calcDistanceLoad([[5,"-"], [3,"-"]], 6, 2, "down",0, 4)).toStrictEqual([ 7, 0 ,2 ]);
});
test("calcDistanceLoad: 5", () => {
    expect(lib.calcDistanceLoad([[5,"-"], [6,"-"]], 3, 4, "up",0, 4)).toStrictEqual([ 2, 0, 0 ]);
});
test("calcDistanceLoad: 6", () => {
    expect(lib.calcDistanceLoad([[5,"-"], [3,"-"]], 6, 4, "down",0, 4)).toStrictEqual([ 4, 0 , 1]);
});
test("calcDistanceLoad: 7", () => {
    expect(lib.calcDistanceLoad([[3,"-"], [5,"-"], [6,"-"]], 4, 2, "stop",0, 4)).toStrictEqual([ 4, 0 ,1 ]);
});
test("calcDistanceLoad: 8", () => {
    expect(lib.calcDistanceLoad([[5,"-"], [6,"-"], [3,"-"]], 4, 2, "stop",0, 4)).toStrictEqual([ 10, 0 , 3 ]);
});
test("calcDistanceLoad: 9", () => {
    expect(lib.calcDistanceLoad([[5,"-"], [6,"-"], [2,"-"]], 3, 7, "up",0, 4)).toStrictEqual([ 7, 0 , 2]);
});
test("calcDistanceLoad: 10", () => {
    expect(lib.calcDistanceLoad([[5,"-"],[3,"-"],[10,"-"]], 6, 7, "down",0, 4)).toStrictEqual([ 10, 0 ,2]);
});
/* ここから計算 */
test("calcDistanceLoad: 11", () => {
    const loadcur = 0.2
    const maxp = 4
    pl = loadcur + lib.diffPredictLoadByListInfo([0, "F"],maxp) * 3 + lib.diffPredictLoadByListInfo([0, "E"],maxp)  * 0;
    expect(lib.calcDistanceLoad([[2,"F"],[3,"F"],[4,"F"]], 1, 5, "up", loadcur, maxp)).toStrictEqual([ 8, 1.1 , 3]);
});
