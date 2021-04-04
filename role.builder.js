const { moveJob, getConstructionSite } = require('helpers.creeps');


const roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {

	    if(creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.building = false;
            creep.say('🔄 resupply');
	    }
	    if(!creep.memory.building && creep.store.getFreeCapacity() == 0) {
	        creep.memory.building = true;
	        creep.say('🚧 build');
	    }

		const spawn = Game.getObjectById(creep.memory.spawn_id);
	    if(creep.memory.building) {
			const targets = spawn.memory.construction_info;
            if(targets.length) {
				let jobPos = targets[0].jobs[0];
				let target = getConstructionSite(spawn.room, jobPos.x, jobPos.y)
				moveJob(creep, () => creep.build(target), target)
            }
	    }
	    else {
            moveJob(creep, () => creep.withdraw(spawn, RESOURCE_ENERGY), spawn);
	    }
	}
};

module.exports = roleBuilder;