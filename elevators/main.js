{
    init: function(elevator_list, floor_list) {

        const num_allelevator = elevator_list.length;
        const num_allfloor = floor_list.length;


        // 停車したフロアの区分によって乗車率を予測する。
        const predictFloorLoadIn = 1.25; // フロアで乗ってきそうな人数 の変化量(+は増加)
        const predictFloorLoadOut = -1.25; // フロアで降りそうな人数 の変化量(+は増加)

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

        function calcDistanceLoad(destqueue, lvcur, lvtarget, direction, loadcur, maxPassengerCount) {
            /*
            directionに向かっているエレベータの
            現在の階数(lvcur)から対象の階数(lvtarget)までのコストを計算するとともに、
            現在乗車率loadcurである到着時点での予想乗車率を計算する。

            destqueueは[floor, type]のリストであり、
            type: F=フロアからの呼び出し、E=エレベータの呼び出し、I=初期位置への移動, B=フロア＋エレベータ呼び出し(both)
            であり、それ以外は無視される。

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
            for(var i = 0; i < destqueue.length; i++) {
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

                if (direction === "up") {
                    if (destqueue[i][0] < lvtmp) { // 次の対象がした側であるなら、
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


        /*
        エレベータの初期状態をリストで得る関数
        エレベータの数とフロアの数を入力すると、地面階と最上階にEVを配置し、そのほかは等間隔に分散するようにEVを配置するリストを返す
         */
        function listInitElevatorLocation(floornum, elevatornum) {
            var res = [];
            res.push(0);
            if (elevatornum === 1) {
                return res;
            }
            // 各階分のループ
            for(i = 0; i < (elevatornum - 1); i++) {
                // 等間隔な配置と最上階への配置を行う
                x = Math.floor( (1/(elevatornum-1)) *  (i + 1) * floornum);
                // floornumに対する0 - 1の割合で計算しているので最後の階数はfloornumと"="になりうる
                // しかし、このゲームは0階originなので、"1"になってとき = floornumの時は一つ下の階を返すことにする
                if (x === floornum) {
                    x -= 1;
                }
                res.push(x)
            }
            return res;
        }

        /*
        ■
        ■ ここまでがテストを書いている関数。以下は特にテストを書いていない関数
        ■
         */


        /*
        elevatorの持つキューをゲームの解釈できるキューに変換する
        内部キューは[destnation_floor, type]になっているため、destnation floorだけを
        切り出したキューを入れてelevatorの動作を読み込ませる
         */
        function refreshQueue(elevator) {
            // destinationQueueに入れる仮の配列
            tmpQueue = [];
            console.log("Elevator[" + elevator.number + "] refreshQueue(): " + elevator.internalQueue);
            // 階数のみを切り出す
            for(i = 0; i < elevator.internalQueue.length; i++)
            {
                tmpQueue.push(elevator.internalQueue[i][0]);
            }
            // ゲーム内の変数に入れて、エレベータに読み込みをさせる
            elevator.destinationQueue = tmpQueue;
            elevator.checkDestinationQueue();
        }

        /*
         * elevarotの中から特定のフロアに停車するエントリがあるかを操作し、そのエントリの
         * [index, type]を返す。これは最初の1エントリのみを返す
         * エントリが見つからない場合falseを返す
         */
        function searchQueue(elevator, floorNum) {
            console.log("searchQueue(): " + floorNum);
            // 階数のみを切り出す
            for(i = 0; i < elevator.internalQueue.length; i++)
            {
                if (elevator.internalQueue[i][0] === floorNum) {
                    console.log("searchQueue(): Found at " + i);
                    return [i, elevator.internalQueue[i][1]];
                }
            }
            return false
        }


        /*
        内部キューに[floor, type]を挿入する
        indexは現在はいっているindexの1個手前に代入する
        ただし、python的に、index = -1で呼ばれた際は、最も後方に追加される。
         */
        function addQueue(elevator, floorNum, type, index) {
            if (index === -1) {
                elevator.internalQueue.push([floorNum, type]);
            } else {
                elevator.internalQueue.splice(index, 0, [floorNum, type]);
            }
            // ゲーム内の変数を操作したため、再読み込みを行う
            refreshQueue(elevator);
        }

        /*
        特定のエレベータのキューから、あるtypeであるフロアに向かうエントリを削除する
        これは最初の1件だけではなくて、キューすべてのエントリを削除する。
         */
        function delQueueSpecificFloorTypeAtElevator(elevator, floorNum, type) {
            isChange = true;
            /* spliceを使った削除のため、削除する内容がなくなるまで削除を行う */
            while(isChange) {
                isChange = false;
                for(i = 0; i < elevator.internalQueue.length; i++) {
                    if (elevator.internalQueue[i][0] === floorNum && elevator.internalQueue[i][1] === type) {
                        console.log(elevator.number + ": erase internal queue " + i);
                        elevator.internalQueue.splice(i, 1);
                        isChange = true;
                    }
                }
            }
            refreshQueue(elevator);
        }

        /*
        すべてのエレベータのキューからあるtypeであるフロアに向かうエントリを削除する
         */
        function delQueueSpecificFloorTypeFromAllElevators(floorNum, type) {
            for (i = 0; i < num_allelevator; i++) {
                delQueueSpecificFloorTypeAtElevator(elevator_list[i], floorNum, type);
            }
        }

        /* 表示灯を変更する */
        function goingUp(elevator){ elevator.goingUpIndicator(true); elevator.goingDownIndicator(false); }
        function goingDown(elevator){ elevator.goingUpIndicator(false); elevator.goingDownIndicator(true); }
        // 停車時はどっちでも行けるので、ユーザのためには両方を表示しておく
        function goingBoth(elevator){ elevator.goingUpIndicator(true); elevator.goingDownIndicator(true); }

        /*
        ■
        ■ エレベータのイベントハンドリング
        ■
         */
        var num_e = 0; // エレベータ番号。initで付与される。
        elevator_list.forEach(function(elevator) {
            elevator.number = num_e; // エレベータ番号
            elevator.internalQueue = []; // 内部キュー
            // エレベータの初期位置用の変数を設定する
            elevator.initfloor = listInitElevatorLocation(num_allfloor, num_allelevator)[num_e];

            // このエレベータの初期化は終わり
            num_e += 1;

            elevator.on("floor_button_pressed", function(floorNum) {
                /*
                 * エレベータ内でボタンが押された時の処理　
                 * エレベータ内でボタンが押された時、エレベータはとにかく最も近い経路でその階に停車すべきである。
                 * この際、もしもすでにフロアからの呼び出して停車が計画されているなら、"B"フラグに変更すべきである。
                 * */
                console.log("Elavator[" + elevator.number + "]: Event callback floor_button_pressed(" + floorNum + ")");
                var alreadyEntry = searchQueue(elevator, floorNum);
                if (alreadyEntry === false) {
                    /* エントリが存在しない場合は新規のエントリであるため、適切な場所に挿入する */
                    console.log(" floonum is NOT existed in internalQueue")
                    var predict = calcDistanceLoad(elevator.internalQueue, elevator.currentFloor(), floorNum, elevator.destinationDirection(),
                        elevator.loadFactor(), elevator.maxPassengerCount());
                    var optimumIndex = predict[2];
                    addQueue(elevator, floorNum, "E", optimumIndex);
                } else {
                    console.log(" floonum is EXIST in internalQueue")
                    /* エントリが存在する場合、それがフロア呼び出しであるなら、"B"に変える。Bの場合はそのまま */
                    if (alreadyEntry[1] === "F") {
                        console.log(" [OK_] already Floor call was exist. change to floor call")
                        elevator.internalQueue[alreadyEntry[0]][1] = "B";
                        console.log(" [OK_] change to " + elevator.internalQueue)
                    } else if (alreadyEntry[1] === "B") {
                        console.log(" [???] already Elavator/Floor call was exist... too jam?")
                        elevator.internalQueue[alreadyEntry[0]][1] = "B";
                    } else if (alreadyEntry[1] === "E") {
                        console.log(" [???] already Elavator call was exist... too jam?")
                        elevator.internalQueue[alreadyEntry[0]][1] = "E";
                    }
                }
            });

            elevator.on("stopped_at_floor", function(floorNum) {
                console.log("Elevator[" + elevator.number + "]: stopped_at_floor : " + floorNum);
                // エレベータ自身にその階向けのqueueがあれば削除する
                /*
                var isChange = true;
                while(isChange) {
                    isChange = false;
                    for(i = 0; i < elevator.internalQueue.length; i++) {
                        if (elevator.internalQueue[i][0] === floorNum) {
                            console.log("Elevator[" + elevator.number + "] erase internal queue " + i);
                            elevator.internalQueue.splice(i, 1);
                            isChange = true;
                        }
                    }
                }
                refreshQueue(elevator);
                 */

                // ここは普通のdesticationQueueを使っていい(installされている経路を使うべきである)
                if(elevator.destinationQueue.length === 0){ // stop時
                    goingBoth(elevator); // 上下両方に行けることを通知
                } else if(elevator.destinationQueue[0] > elevator.currentFloor() ) { // 上向き
                    goingUp(elevator);
                } else { // 下向き
                    goingDown(elevator);
                }

            });
        });

        /*
        ■
        ■ フロアのイベントハンドリング
        ■
         */
        floor_list.forEach(function(floor) {
            floor.on("up_button_pressed down_button_pressed", function() {
                floorNum = floor.floorNum()
                console.log("Floor[" + floorNum + "]: button_pressed");
                candidateElevatorNum = -1; // -1 = 未選択
                candidateCost = 10
                candidateIndex = -1
                for (var i = 0; i < num_allelevator; i++) {
                    e = elevator_list[i];
                    predict = calcDistanceLoad(e.internalQueue, e.currentFloor(), floorNum, e.destinationDirection(),
                        e.loadFactor(), e.maxPassengerCount());
                    var cost = predict[0];
                    var pl = predict[1];
                    var index = predict[2];
                    if (pl > 1) {
                        console.log(" Elevator[" + i + "]: load will be high. SKIP.");
                    } else {
                        console.log(" Elevator[" + i + "]: cantidate - cost: " + cost + " load: " + pl + " index: " + index);
                        if (candidateCost > cost) { // コストが小さいなら
                            candidateCost = cost;
                            candidateIndex = index;
                            candidateElevatorNum = i;
                        }
                    }
                    if (candidateElevatorNum === -1) {
                        console.log(" Unfortunately! All elevators load is too high! ")
                    } else {
                        addQueue(elevator_list[candidateElevatorNum], floorNum, "F", candidateIndex);
                    }
                }


                /*
                console.log(elevator_list[0].number + ": button_pressed");

                function sort_func(a, b){
                    if( Math.abs(a.currentFloor() - floor.floorNum()) < Math.abs(b.currentFloor() - floor.floorNum())){
                        return -1;
                    } else {
                        return 1;
                    }
                }

                elevator_list.sort(sort_func);

                addQueue(elevator_list[0], floor.floorNum(), "F", -1);
                */
            });
        });
    },

    update: function(dt, elevators, floors) { /* null */ }
}