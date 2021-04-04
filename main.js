var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleTower = require('role.tower');

const { getConstructionSite } = require('helpers.creeps')

const NO_VACANCIES = 2;

const coordaround = [
    [0, 1],
    [1, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
    [-1, -1],
    [1, -1],
    [-1, 1],
];

var JOB_MAP = {
    'harvester': roleHarvester,
    'upgrader': roleUpgrader,
    'builder': roleBuilder,
}

function createBody(room, partWeights) {
    
}

const BASE_CREEP_SPEC = [WORK, CARRY, MOVE]

function spawnCreep({ spawn, name, creepSpec, memory }) {
    
    const dryRun = spawn.spawnCreep(creepSpec, name, { memory, dryRun: true })
    if (dryRun !== OK) {
        return dryRun
    }
    console.log("Spawning", name)
    return spawn.spawnCreep(creepSpec, name, { memory });
}

function fillJob(creepName, spawn, jobList, specMaker, vacancies) {
    let name;
    let job;
    for (let i = 0; i < jobList.length; i++) {
        job = jobList[i];
        for (let space = 0; space < (vacancies || job.spaces); space++) {
            name = `${creepName}-${spawn.name}-${i}-${space}`
            if (!Game.creeps[name]) {
                return spawnCreep({
                    spawn,
                    name,
                    ...specMaker(job),
                })
            }
        }
    }
    return NO_VACANCIES;
}

function fillAvailableHarvesterJob(spawn) {
    return fillJob('harvester', spawn, spawn.memory.source_info, (job) => ({
        creepSpec: BASE_CREEP_SPEC,
        memory: {
            role: 'harvester',
            source_id: job.id,
        }
    }))
}

function fillAvailableBuilderJobs(spawn) {
    const BUILDER_PER_SITE = 1;
    return fillJob('builder', spawn, spawn.memory.construction_info, () => ({
        creepSpec: BASE_CREEP_SPEC,
        memory: {
            role: 'builder',
            spawn_id: spawn.id,
        }
    }), BUILDER_PER_SITE)
}

function fillAvailableUpgraderJobs(spawn) {
    const UPGRADER_COUNT = Math.min(Math.floor(spawn.room.controller.level / 2), 1);
    return fillJob('upgrader', spawn, [spawn.room.controller.id], (job) => ({
        creepSpec: BASE_CREEP_SPEC,
        memory: {
            role: 'upgrader',
            controller_id: job,
            storage_id: spawn.id,
        }
    }), UPGRADER_COUNT);
}

function fillJobs(spawn) {
    if (!spawn.memory.jobUpdateTime || spawn.spawning !== null) {
        return 1;
    }
    const jobGen = [
        fillAvailableHarvesterJob,
        fillAvailableBuilderJobs,
        fillAvailableUpgraderJobs,
    ];
    for (let i = 0; i < jobGen.length; i++) {
        let returnCode = jobGen[i](spawn);
        if (returnCode !== NO_VACANCIES) {
            return returnCode;
        }
    }
    return 0;
}

function creepHandler() {
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (!creep.memory.role) {
            creep.suicide();
        }
        JOB_MAP[creep.memory.role].run(creep);
    }
}

function towerHandler(room) {
    var roomTowers = room.find(FIND_MY_STRUCTURES, {
        filter: (structure) => {
            return structure.structureType == STRUCTURE_TOWER && (structure.energy > 9)
        }
    })
    for (var i = 0; i < roomTowers.length; i++) {
        roleTower.run(roomTowers[i]);
    }
}

function isTerrain(roomName, x, y) {
    return Game.map.getRoomTerrain(roomName).get(x, y) !== 0;
}

function getSpaceAroundPosition(pos) {
    let spaces = 0;
    let x;
    let y;
    for (let i = 0; i < coordaround.length; i++) {
        x = pos.x + coordaround[i][0];
        y = pos.y + coordaround[i][1];
        if (!isTerrain(pos.roomName, x, y)) {
            spaces += 1;
        }
    }
    return spaces;
}

function getDistance(posa, posb) {
    const a = posa.x - posb.x
    const b = posa.y - posb.y
    return Math.sqrt((a * a) + (b * b));
}

function getPop() {
    return Object.keys(Game.creeps).length;
}

function getBreakPoint(points, num) {
    return points.findIndex(n => n > num);
}

function getValidSources(spawn) {
    const breakpoints = [5, 15, 30, 50];
    const pop = getPop();
    let sources = spawn.room.find(FIND_SOURCES);
    const output = [];
    let spaces;
    for (let i = 0; i < sources.length; i++) {
        spaces = getSpaceAroundPosition(sources[i].pos);
        if (spaces > 0) {
            output.push({
                id: sources[i].id,
                spaces,
                distance: getDistance(spawn.pos, sources[i].pos),
            })
        }
    }
    output.sort((a, b) => a.distance - b.distance);
    const maxSources = getBreakPoint(breakpoints, pop)
    const sourceLength = maxSources == -1 ? sources.length : Math.min(sources.length, maxSources + 1);
    spawn.memory["source_info"] = output.slice(0, sourceLength);
}

function getExtensionsOfSpawn(spawn) {
    return spawn.room.find(FIND_STRUCTURES, {
        filter: (s) => s.structureType == STRUCTURE_EXTENSION,
    });
}

function isFreeSpace(room, x, y) {
    const items = room.lookAt(x, y);
    for (let i = 0; i < items.length; i++) {
        let obj = items[i];
        if (!(obj.terrain === 'plain' || obj.type === 'creep')) {
            return false;
        }
    }
    return true;
}

function attemptBuildingExtension(room, numOfExtensions) {
    const BATTERY_GRID_LENGTH = 8;
    const centerX = 25;
    const centerY = 25;
    // Final grid is 64
    const startX = centerX - 8;
    const startY = centerY - 8;
    const endX = centerX + 7;
    const endY = centerY + 7
    const freePositions = [];
    for (let x = startX; x < endX; x += 2) {
        for (let y = startY; y < endY; y += 2) {
            if (isFreeSpace(room, x, y)) {
                freePositions.push([x, y]);
                if (freePositions.length === numOfExtensions) {
                    return freePositions;
                }
            }
        }
    }
    return freePositions;
}

function planExpansions(spawn) {
    if (!spawn.memory.construction_info) {
        spawn.memory.construction_info = [];
    }
    console.log("Planning expansion")
    const MAX_PLAN_PER_TICK = 3;
    const EXTENSION_MAP = [5, 10, 20, 30, 40, 50, 60]

    const controllerLevel = spawn.room.controller.level;
    if (controllerLevel < 2) {
        console.log("too low controller;")
        return;
    }
    const plannerIndex = controllerLevel - 2;
    const minExtensions = EXTENSION_MAP[plannerIndex];


    const currentlyPlannedExtensions = spawn.memory.construction_info
        .filter(x => x.type === STRUCTURE_EXTENSION);

    const currentExtensionCount = _.reduce(
        currentlyPlannedExtensions,
        (sum, obj) => sum + obj.jobs.length,
        0,
    );
    if (currentExtensionCount >= minExtensions) {
        console.log("Already planned");
        return;
    }

    const currentExtensions = getExtensionsOfSpawn(spawn).length 

    const netExtensions = currentExtensions + currentExtensionCount;

    if (netExtensions >= minExtensions) {
        console.log("Already made");
        return;
    }

    const extensionsToBuild = Math.min(minExtensions - netExtensions, MAX_PLAN_PER_TICK);
    const extensionCoords = attemptBuildingExtension(spawn.room, extensionsToBuild);
    console.log(`Building ${extensionsToBuild} sites`)
    const jobSpec = [];
    for (let i = 0; i < extensionCoords.length; i++) {
        let x = extensionCoords[i][0];
        let y = extensionCoords[i][1];
        let code = spawn.room.createConstructionSite(x, y, STRUCTURE_EXTENSION)
        if (code === OK) {
            jobSpec.push({
                x,
                y,
            })
        }
    }
    if (jobSpec.length > 0) {
        spawn.memory.construction_info.push({
            type: STRUCTURE_EXTENSION,
            jobs: jobSpec,
        })
    } else {
        cleanUpJobs(spawn);
    }
}


function spliceArray(arr, func) {
    let i;
    while (i < arr.length) {
        if (func(arr[i])) {
            arr.splice(i, 1);
        } else {
            ++i;
        }
    }
}


function cleanUpJobs(spawn) {
    if (!spawn.memory.construction_info) {
        return;
    }
    
    spliceArray(spawn.memory.construction_info, (job) => {
        spliceArray(job.jobs, (site) => {
            return getConstructionSite(spawn.room, site.x, site.y) === undefined;
        })
        return job.jobs.length === 0;
    })
}



function refreshJobList(spawn) {
    getValidSources(spawn);
    planExpansions(spawn);
    spawn.memory["jobUpdateTime"] = Game.time;
}

module.exports.loop = function () {
    for (let spawnName in Game.spawns) {
        let spawn = Game.spawns[spawnName];
        if (Game.time % 5 == 0) {
            refreshJobList(spawn);
        }
        fillJobs(spawn);
    }
    creepHandler();
}