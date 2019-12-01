
const predictFloorLoadIn = 1.2 // フロアで乗ってきそうな人数 の変化量(+は増加)
const predictFloorLoadOut = -1.2 // フロアで降りそうな人数 の変化量(+は増加)
module.exports.predictFloorLoadIn = predictFloorLoadIn;
module.exports.predictFloorLoadOut = predictFloorLoadOut;

function diffPredictLoadByListInfo(dest, maxPassengerCount) {
    if (dest[1] === "F") {
        return Math.floor(predictFloorLoadIn / maxPassengerCount * 100) / 100;

    } else if (dest[1] === "E") {
        return Math.floor(predictFloorLoadOut / maxPassengerCount * 100) / 100;
    } else if (dest[1] === "B") {
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
    var loadPredict = loadcur
    if(destqueue.length === 0){
        // 宛先キューが一切ない場合、index = 0として返す(頭に挿入されれば良い)
        return [Math.abs(lvcur - lvtarget), 0, loadPredict, 0];
    }

    var lvtmp = lvcur;
    // すべてのリストについて走査を行う
    for(i = 0; i < destqueue.length; i++) {

        // console.debug("i=" + i + ", " + destqueue[i] + "lp=" + loadPredict)
        cost += 1;

        /******************/
        /* 上下反転ロジック。 */
        /* 今までの移動方向に対して逆方向に進む方向なのであれば、方向を逆転させる*/
        /******************/
        if(direction === "up") {
            // 次の階は下方であり、対象は今の位置よりも下なのであれば下向きにする
            // 次の階が下方であっても、対象がより上の階ならそのまま上向きにしなければならない
            if(destqueue[i][0] < lvtmp && lvtarget <= lvtmp) {
                direction = "down";
            }
        } else if (direction === "down") {
            // 次の階は上方であり、対象は今の位置よりも上なのであれば上向きにする
            // 次の階が上方であっても、対象がより下の階ならそのまま下向きにしなければならない
            if (destqueue[i][0] > lvtmp && lvtarget >= lvtmp) {
                direction = "up";
            }
        }

        /******************/
        /* 上 */
        /******************/
        if (direction === "up") {
            if (destqueue[i][0] < lvtmp) { // 次の宛先がした側であるなら、
                if(lvtarget > lvtmp) { // もし、目標がより高いフロアにあるならそれを返す
                    loadPredict += diffPredictLoadByListInfo(destqueue[i], maxPassengerCount); // 階に停まるのでpredictload更新
                    cost += Math.abs(lvtarget - lvtmp);
                    // indexは次の前に挿入する
                    return [cost, loadPredict, i];
                }
                // そうでないなら次は下向き(で、コストを加算しないで次へ)
                loadPredict += diffPredictLoadByListInfo(destqueue[i], maxPassengerCount); // 階に停まるのでpredictload更新
                cost -= 1;
                direction = "down";
                continue
            }
            if (destqueue[i][0] > lvtarget && lvcur < lvtarget) { // もし、次の目的地がターゲットを超えるのであればそこまでの距離を生産
                cost += Math.abs(lvtarget - lvtmp);
                // 次の目的地の前に目的地があるのだからi-1
                return [cost, loadPredict, i];
            }
            // 単調増加中である場合、そこまでの距離を足す
            loadPredict += diffPredictLoadByListInfo(destqueue[i], maxPassengerCount); // 階に停まるのでpredictload更新
            cost += Math.abs(lvtmp - destqueue[i][0]);
            lvtmp = destqueue[i][0];
        } else if (direction === "down") {
            if (destqueue[i][0] > lvtmp) { // 上向きになったとき場合
                if(lvtarget < lvtmp) { // もし、目標がより下であったならそれを返す
                    loadPredict += diffPredictLoadByListInfo(destqueue[i], maxPassengerCount); // 階に停まるのでpredictload更新
                    cost += Math.abs(lvtarget - lvtmp);
                    // indexは次の前に挿入する
                    return [cost, loadPredict, i];
                }
                // そうでないなら下向きになったとみなす(で、コストを加算しないで次へ)
                loadPredict += diffPredictLoadByListInfo(destqueue[i], maxPassengerCount); // 階に停まるのでpredictload更新
                cost -= 1;
                direction = "up";
                continue
            }
            if (destqueue[i][0] < lvtarget && lvcur > lvtarget) { // もし、次の目的地がターゲットを超えるのであればそこまでの距離を生産
                cost += Math.abs(lvtarget - lvtmp);
                // 次の目的地の前に目的地があるのだからi-1
                return [cost, loadPredict, i];
            }
            // 単調減少中である場合、そこまでの距離を足す
            loadPredict += diffPredictLoadByListInfo(destqueue[i], maxPassengerCount); // 階に停まるのでpredictload更新
            cost += Math.abs(lvtmp - destqueue[i][0]);
            lvtmp = destqueue[i][0];
        } else if (direction === "stop") {
            if (destqueue[i][0] < lvtmp) {
                direction = "down";
            } else if (destqueue[i][0] > lvtmp) {
                direction = "up";
            } else {
                break;
            }
            loadPredict += diffPredictLoadByListInfo(destqueue[i], maxPassengerCount); // 階に停まるのでpredictload更新
            cost += Math.abs(lvtmp - destqueue[i][0]);
            lvtmp = destqueue[i][0];
        }
    }
    // console.debug("index" + i)
    // もう最後の地点まで移動したので、その地点分の待機時間を追加
    cost += 1;
    // 最後の地点からの距離を加算する
    cost += Math.abs(lvtmp - lvtarget);
    return [cost, loadPredict, i]
}
module.exports.calcDistanceLoad = calcDistanceLoad;
module.exports.diffPredictLoadByListInfo = diffPredictLoadByListInfo;

console.log(calcDistanceLoad([[5,"F"], [6,"F"], [3,"F"]], 4, 2, "stop",0, 4));
console.log(calcDistanceLoad([[5,"F"],[3,"F"],[10,"F"]], 6, 7, "down", 0.5, 4));
console.log(calcDistanceLoad([[5,"F"], [6,"F"]], 3, 7, "up",0.1, 4));
console.log(calcDistanceLoad([[2,"F"],[3,"F"],[4,"F"]], 1, 5, "up", 0.2, 4));