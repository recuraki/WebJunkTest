
/*
エレベータの初期状態をリストで得る関数
エレベータの数とフロアの数を入力すると、地面階と最上階にEVを配置し、そのほかは等間隔に分散するようにEVを配置するリストを返す
 */
function listInitElevatorLocation(floornum, elevatornum) {
    var res = [];
    res.push(0)
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
module.exports = listInitElevatorLocation;