var roleHarvester = require('role.economy');
var roleUpgrader = require('role.economy');
var roleBuilder = require('role.economy');
var roomMonitor = require('role.defence');
var roleTower = require('role.defence');

module.exports.loop = function () {
    for(var name in Game.rooms) {
        roomMonitor.run(Game.rooms[name]);
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
}
