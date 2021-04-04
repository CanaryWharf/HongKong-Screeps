const DEFAULT_STROKE = '#fff'
const helpers = {
    moveJob(creep, job, target, stroke) {
        if (job() == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, {
                visualizePathStyle: {
                    stroke: stroke || DEFAULT_STROKE
                }
            })
        }
    },

    getConstructionSite(room, x, y) {
        const clutter = room.lookAt(x, y);
        for (let i = 0; i < clutter.length; i++) {
            if (clutter[i].type === LOOK_CONSTRUCTION_SITES) {
                return clutter[i][LOOK_CONSTRUCTION_SITES];
            }
        }
        return undefined;
    },
}

module.exports = helpers;