var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleTower = require('role.tower');

module.exports.loop = function () {

    for (let name in Memory.creeps) {
        // and checking if the creep is still alive
        if (Game.creeps[name] == undefined) {
            // if not, delete the memory entry
            delete Memory.creeps[name];
        }
    }

    for(let tower in Game.spawns.NorthGreenwich.room.find(
                FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}})) {
        roleTower.run(tower);
    }
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        }
        if(creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
        if(creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
    }
    var minreqs = {
        'harvester': 4,
        'upgrader': 0,
        'builder': 0
    }

    for(let key in minreqs) {
        var nums = _.sum(Game.creeps, (c) => c.memory.role == key);
        if(nums < minreqs[key]) {
            Game.spawns.NorthGreenwich.createCreep([WORK, CARRY, MOVE], undefined, {role: key})
        }
    }
}
