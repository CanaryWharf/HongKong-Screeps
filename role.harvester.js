const { moveJob } = require('helpers.creeps');

var roleHarvester = {

    assignHarvester(creep) {
        var mines = creep.room.memory;
    },

    /** @param {Creep} creep **/
    run: function(creep) {
        if (!creep.memory.role || ! creep.memory.source_id) {
            return;
        }
	    if(creep.store.getFreeCapacity() > 0) {
            let source = Game.getObjectById(creep.memory.source_id)
            moveJob(creep, () => creep.harvest(source), source);
        }
        else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION ||
                                structure.structureType == STRUCTURE_SPAWN ||
                                structure.structureType == STRUCTURE_TOWER) && 
                                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
            });
            if(targets.length > 0) {
                moveJob(
                    creep,
                    () => creep.transfer(targets[0], RESOURCE_ENERGY),
                    targets[0],
                )
            } else {
                moveJob(creep, () => creep.upgradeController(creep.room.controller), creep.room.controller)
            }
        }
	}
};

module.exports = roleHarvester;