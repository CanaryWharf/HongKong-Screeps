const { moveJob } = require('helpers.creeps');

var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function(creep) {

	    if(!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
	        creep.memory.upgrading = true;
	        creep.say('⚡ upgrade');
	    } else if (creep.memory.upgrading && creep.store.getUsedCapacity() == 0) {
            creep.memory.upgrading = false;
            creep.say('🔄 resupply');
	    }

	    if(creep.memory.upgrading) {
            const controller = Game.getObjectById(creep.memory.controller_id);
            moveJob(creep, () => creep.upgradeController(controller), controller)
        }
        else {
            const storage = Game.getObjectById(creep.memory.storage_id)
            moveJob(creep, () => creep.withdraw(storage, RESOURCE_ENERGY), storage);
        }
	}
};

module.exports = roleUpgrader;