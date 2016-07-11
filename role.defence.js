var roomMonitor = {
    run: function(roomName) {
    var hostiles = Game.rooms[roomName].find(FIND_HOSTILE_CREEPS);
    if(hotiles.length > 0) {
        return true;
    } else {return false;}
        }
    }
}


    
}

var roleTower = {
    run: function(tower) {
        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if(closestHostile) {
            tower.attack(closestHostile);
        }
    }
}

modules.exports = {
    overwatch,
    roleTower
};
