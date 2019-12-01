
const predictFloorLoadIn = 1.2 // フロアで乗ってきそうな人数 の変化量(+は増加)
const predictFloorLoadOut = -1.2 // フロアで降りそうな人数 の変化量(+は増加)
module.exports.predictFloorLoadIn = predictFloorLoadIn;
module.exports.predictFloorLoadOut = predictFloorLoadOut;

function diffPredictLoadByListInfo(dest, maxPassengerCount) {
    console.log("diffPredictLoadByListInfo +" dest + "/" + maxPassengerCount)
    if (dest[1] === "U" || dest[1] === "D") {
        return Math.floor(predictFloorLoadIn / maxPassengerCount * 100) / 100;
    } else if (dest[1] === "E") {
        return Math.floor(predictFloorLoadOut / maxPassengerCount * 100) / 100;
    } else if (dest[1] === "EU" || dest[1] === "ED") {
        return Math.floor(( predictFloorLoadIn + predictFloorLoadOut ) / maxPassengerCount * 100) / 100;
    }
    return 0;
}

function calcDistanceLoad(destqueue, lvcur, lvtarget, direction, directionTarget, loadcur, maxPassengerCount) {
    /*
    directionに向かっているエレベータの
    現在の階数(lvcur)から対象の階数(lvtarget)までのコストを計算するとともに、
    現在乗車率loadcurである到着時点での予想乗車率を計算する。

    destqueueは[floor, type]のリストであり、
    type: F=フロアからの呼び出し、E=エレベータの呼び出し、I=初期位置への移動, B=フロア＋エレベータ呼び出し(both)
    であり、それ以外は無視される。

    directionTargetは"up", "down", "any"のいずれかである。
    フロアの呼び出しの場合、upかdownが選択されるはずである。
    この場合、「間」への停車であれば、その時の動きと一致しなければならない。
    折り返し地点の場合、"up"でも"down"でも停車する。な

    戻り値はリストであり、
    [cost, predictLoad, index]
    である。
     */


    var cost = 0;
    var loadPredict = loadcur;
    if(destqueue.length === 0){
        // 宛先キューが一切ない場合、index = 0として返す(頭に挿入されれば良い)
        return [Math.abs(lvcur - lvtarget), loadcur, 0];
    }

    /* 停車状態が与えられた時の処理 */
    if (direction === "stop") {
        if (destqueue[0][0] < lvcur) {
            direction = "down";
        } else if (destqueue[i][0] > lvcur) {
            direction = "up";
        } else {
            // 基本的に同じ階の時に停車中というのはないはずだが、
            console.log("UNREACH")
            direction = "down";
        }
    }

    // すべてのリストについて走査を行う
    for(i = 0; i < destqueue.length; i++) {

        cost += 1;
        console.debug("i=" + i + " lvcur=" + lvcur + " queue=" + destqueue[i] + " lp=" + loadPredict + " cost: " + cost + " dir=" + direction)

        /******************/
        /* 上 */
        /******************/
        if (direction === "up") {
            if( (i + 1) < destqueue.length ) {
                /* もしも、次はdownになるのだが、targetが今より上になる場合、 */
                if (destqueue[i][0] > destqueue[i + 1][0] && lvtarget > lvcur) {
                    // 上が押されていても下が押されていても気にしないで上に突っ走ることになる
                    console.log(" target is more overarea")
                    loadPredict += diffPredictLoadByListInfo(destqueue[i], maxPassengerCount); // 階に停まるのでpredictload更新
                    cost += Math.abs(lvtarget - lvcur);
                    cost += 1;
                    // indexは次の前に挿入する
                    return [cost, loadPredict, i + 1];
                }
            }
            if (destqueue[i][0] > lvtarget && lvtarget > lvcur && directionTarget !== "down") {
                // 次の目的地がターゲットを超えるのであればそこまでの距離を生産
                // この場合、上記の通り、directionTargetはdownではいけない
                console.log("target is between area[up");
                cost += Math.abs(lvtarget - lvcur);
                // 次の目的地の前に目的地があるのだからi-1
                return [cost, loadPredict, i];
            }
            // 単調増加中である場合、そこまでの距離を足す
            console.log("continue");
            loadPredict += diffPredictLoadByListInfo(destqueue[i], maxPassengerCount); // 階に停まるのでpredictload更新
            cost += Math.abs(lvcur - destqueue[i][0]);
            lvcur = destqueue[i][0];
        }
        /******************/
        /* 下り */
        /******************/
        else if (direction === "down") {
            if( (i + 1) < destqueue.length ) {
                /* もしも、次はupになるのだが、targetが今より下になる場合、 */
                if (destqueue[i][0] < destqueue[i + 1][0] && lvtarget < lvcur) {
                    // 上が押されていても下が押されていても気にしないで下に突っ走ることになる
                    console.log(" target is more underarea")
                    loadPredict += diffPredictLoadByListInfo(destqueue[i], maxPassengerCount); // 階に停まるのでpredictload更新
                    cost += Math.abs(lvtarget - lvcur);
                    cost += 1;
                    // indexは次の前に挿入する
                    return [cost, loadPredict, i + 1];
                }
            }
            if (destqueue[i][0] < lvtarget && lvtarget < lvcur && directionTarget !== "up") {
                // もし、目的地がターゲットを超えるのであればそこまでの距離を生産
                // この場合、上記の通り、directionTargetはupではいけない
                console.log("target is between area[down]");
                cost += Math.abs(lvtarget - lvcur);
                // 次の目的地の前に目的地があるのだからi-1
                return [cost, loadPredict, i];
            }
            // 単調増加中である場合、そこまでの距離を足す
            console.log("continue");
            loadPredict += diffPredictLoadByListInfo(destqueue[i], maxPassengerCount); // 階に停まるのでpredictload更新
            cost += Math.abs(lvcur - destqueue[i][0]);
            lvcur = destqueue[i][0];
        }

        /******************/
        /* 上下反転ロジック。 */
        /* 次が今までの移動方向に対して逆方向に進む方向なのであれば、方向を逆転させる*/
        /******************/
        if( (i + 1) < destqueue.length ) {
            if (direction === "up") {
                // 次の階は下方であり、対象は今の位置よりも下なのであれば下向きにする
                if (destqueue[i+ 1][0] < lvcur) {
                    console.log(" reverse!")
                    direction = "down";
                }
            } else if (direction === "down") {
                // 次の階は上方であり、対象は今の位置よりも上なのであれば上向きにする
                if (destqueue[i + 1][0] > lvcur) {
                    console.log(" reverse!")
                    direction = "up";
                }
            }
        }

    }
    console.debug("final: " + i + " lvcur=" + lvcur + " queue=" + destqueue[i] + " lp=" + loadPredict + " cost: " + cost + " dir=" + direction)
    // もう最後の地点まで移動したので、その地点分の待機時間を追加
    cost += 1;
    // 最後の地点からの距離を加算する
    cost += Math.abs(lvcur - lvtarget);
    return [cost, loadPredict, i]
}
module.exports.calcDistanceLoad = calcDistanceLoad;
module.exports.diffPredictLoadByListInfo = diffPredictLoadByListInfo;

console.log(calcDistanceLoad([[5,"-"], [6,"-"], [2,"-"]], 3, 7, "up","down",0, 4));
/*
console.log(calcDistanceLoad([[5,"-"],[3,"-"],[10,"-"]], 6, 7, "down","any",0, 4));
console.log(calcDistanceLoad([[2,"F"],[5,"F"],[10,"F"],[5,"F"],[2,"F"],], 1, 9, "stop","down",0, 4));
console.log(calcDistanceLoad([[2,"F"],[5,"F"],[10,"F"],[5,"F"],[2,"F"],], 1, 3, "stop","any",0, 4));
console.log(calcDistanceLoad([[2,"F"],[5,"F"],[10,"F"],[5,"F"],[2,"F"],], 1, 3, "stop","up",0, 4));
console.log(calcDistanceLoad([[5,"F"], [6,"F"], [3,"F"]], 4, 2, "stop","down",0, 4));
console.log(calcDistanceLoad([[5,"F"],[3,"F"],[10,"F"]], 6, 7, "down", "down",0.5, 4));
console.log(calcDistanceLoad([[5,"F"], [6,"F"]], 3, 7, "up","down",0.1, 4));
console.log(calcDistanceLoad([[2,"F"],[3,"F"],[4,"F"]], 1, 5, "up", "down",0.2, 4));
*/