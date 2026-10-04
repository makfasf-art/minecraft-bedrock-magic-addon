import * as server from "@minecraft/server";

/**
 * Add-on: Magic Arsenal & Orbital Cannon
 * - Welcome title saat player join
 * - Orbital Cannon Strike via !cannon atau item custom cannon:pointer
 * - 9 elemen sihir
 *
 * Catatan: ini adalah contoh Behavior Pack Script API Bedrock
 * yang berfokus pada fungsionalitas. Tingkat kompatibilitas API
 * bisa berubah tergantung target runtime Bedrock Anda.
 */

const TITLE_GOLD = "gold";
const SUBTITLE_AQUA = "aqua";

function sendWelcomeTitle(player) {
  player.runCommand('title @s title {"text":"Selamat Datang","color":"gold","bold":true}');
  player.runCommand('title @s subtitle {"text":"Selamat Berpetualang!","color":"aqua"}');
  player.runCommand("title @s times 10 80 15");
}

function getForwardTarget(player, reach = 25) {
  const loc = player.location;
  const dir = player.getViewDirection();

  return {
    x: Math.floor(loc.x + dir.x * reach),
    y: Math.floor(loc.y + dir.y * reach + 1),
    z: Math.floor(loc.z + dir.z * reach),
  };
}

function spawnBurstParticles(player, target, count = 28) {
  for (let i = 0; i < count; i++) {
    const px = target.x + (Math.random() - 0.5) * 6;
    const py = target.y + 2 + Math.random() * 4;
    const pz = target.z + (Math.random() - 0.5) * 6;
    player.dimension.runCommand(`particle minecraft:explosion_emitter ${px} ${py} ${pz}`);
  }
}

function triggerOrbitalCannon(player) {
  const target = getForwardTarget(player, 24);

  // Radius 5x5 dari langit ke target area
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      const x = target.x + dx;
      const y = target.y + 12;
      const z = target.z + dz;

      // TNT aktif dengan fuse pendek
      player.dimension.runCommand(`summon tnt ${x} ${y} ${z} {Fuse:20}`);

      // Hujan anak panah dari langit
      player.dimension.runCommand(`summon arrow ${x} ${y + 2} ${z} {life:1200,damage:3.5}`);
      player.dimension.runCommand(`summon arrow ${x + 0.3} ${y + 3} ${z + 0.3} {life:1200,damage:3.5}`);
      player.dimension.runCommand(`summon arrow ${x - 0.3} ${y + 2.5} ${z - 0.3} {life:1200,damage:3.5}`);
    }
  }

  spawnBurstParticles(player, target, 30);
  player.sendMessage("Orbital Cannon Strike activated!");
}

// ===============================
// Welcome title trigger
// ===============================
server.world.events.playerJoin.subscribe((event) => {
  const player = event.player;
  if (!player) return;
  sendWelcomeTitle(player);
});

// ===============================
// Command trigger: !cannon
// ===============================
server.world.events.beforeChat.subscribe((event) => {
  const { message, sender } = event;
  if (!sender) return;

  if (message.trim() === "!cannon") {
    event.cancel = true;
    triggerOrbitalCannon(sender);
  }
});

// ===============================
// Item trigger: cannon:pointer
// ===============================
server.world.afterEvents.itemUse.subscribe((event) => {
  const { source, itemStack } = event;
  if (!source || !itemStack) return;

  if (itemStack.typeId === "cannon:pointer") {
    triggerOrbitalCannon(source);
  }

  // Item custom magic trigger
  const magicMap = {
    "magic:fire": () => castFire(source),
    "magic:earth": () => castEarth(source),
    "magic:quake": () => castQuake(source),
    "magic:air": () => castAir(source),
    "magic:tsunami": () => castTsunami(source),
    "magic:flood": () => castFlood(source),
    "magic:lava": () => castLava(source),
    "magic:meteor": () => castMeteorMagma(source),
    "magic:tornado": () => castTornado(source),
  };

  const fn = magicMap[itemStack.typeId];
  if (fn) {
    fn();
  }
});

// ===============================
// 1. Api (Fire Line)
// ===============================
function castFire(player) {
  const loc = player.location;
  const dir = player.getViewDirection();

  for (let i = 1; i <= 12; i++) {
    const x = Math.floor(loc.x + dir.x * i);
    const y = Math.floor(loc.y + dir.y * i + 1);
    const z = Math.floor(loc.z + dir.z * i);

    player.dimension.runCommand(`setblock ${x} ${y} ${z} minecraft:fire`);
    player.dimension.runCommand(`particle minecraft:lava_particle ${x} ${y + 0.5} ${z}`);
    player.dimension.runCommand(`effect @e[r=2,x=${x},y=${y},z=${z}] minecraft:burning 5 0 true`);
  }
}

// ===============================
// 2. Tanah (3x3 wall)
// ===============================
function castEarth(player) {
  const loc = player.location;
  const dir = player.getViewDirection();

  const cx = Math.floor(loc.x + dir.x * 3);
  const cy = Math.floor(loc.y + 1);
  const cz = Math.floor(loc.z + dir.z * 3);

  const wall = [
    [0, 0, 0], [1, 0, 0], [-1, 0, 0],
    [0, 0, 1], [0, 0, -1], [1, 0, 1],
    [-1, 0, -1], [1, 0, -1], [-1, 0, 1],
  ];

  for (const [dx, dy, dz] of wall) {
    const x = cx + dx;
    const y = cy + dy;
    const z = cz + dz;
    player.dimension.runCommand(`setblock ${x} ${y} ${z} minecraft:stone`);
  }
}

// ===============================
// 3. Gempa (quake)
// ===============================
function castQuake(player) {
  const loc = player.location;
  const radius = 10;

  const entities = player.dimension.getEntities({
    location: { x: loc.x, y: loc.y, z: loc.z },
    maxDistance: radius,
  });

  for (const entity of entities) {
    if (entity.id === player.id) continue;

    const pos = entity.location;
    entity.teleport(
      { x: pos.x, y: pos.y + 3, z: pos.z },
      { x: 0, y: 0, z: 0 },
      false,
    );
    player.dimension.runCommand(`particle minecraft:crit ${pos.x} ${pos.y + 2} ${pos.z}`);
  }

  player.dimension.runCommand(`particle minecraft:large_explosion ${loc.x} ${loc.y + 1} ${loc.z}`);
}

// ===============================
// 4. Air (temporary water)
// ===============================
function castAir(player) {
  const loc = player.location;
  const dir = player.getViewDirection();

  const blocks = [];
  for (let i = 1; i <= 4; i++) {
    const x = Math.floor(loc.x + dir.x * i);
    const y = Math.floor(loc.y + dir.y * i + 1);
    const z = Math.floor(loc.z + dir.z * i);
    blocks.push({ x, y, z });
    player.dimension.runCommand(`setblock ${x} ${y} ${z} minecraft:water`);
  }

  setTimeout(() => {
    for (const b of blocks) {
      player.dimension.runCommand(`setblock ${b.x} ${b.y} ${b.z} minecraft:air`);
    }
  }, 5000);
}

// ===============================
// 5. Tsunami (wave forward)
// ===============================
function castTsunami(player) {
  const loc = player.location;
  const dir = player.getViewDirection();

  const blocks = [];
  for (let i = 0; i < 16; i++) {
    const x = Math.floor(loc.x + dir.x * (i + 1));
    const y = Math.floor(loc.y);
    const z = Math.floor(loc.z + dir.z * (i + 1));
    blocks.push({ x, y, z });
    player.dimension.runCommand(`setblock ${x} ${y} ${z} minecraft:water`);
    player.dimension.runCommand(`particle minecraft:water_evaporation_bucket ${x} ${y + 0.7} ${z}`);
  }

  setTimeout(() => {
    for (const b of blocks) {
      player.dimension.runCommand(`setblock ${b.x} ${b.y} ${b.z} minecraft:air`);
    }
  }, 1200);
}

// ===============================
// 6. Banjir (15x15 water area)
// ===============================
function castFlood(player) {
  const loc = player.location;
  const cells = [];

  for (let dx = -7; dx <= 7; dx++) {
    for (let dz = -7; dz <= 7; dz++) {
      const x = Math.floor(loc.x + dx);
      const y = Math.floor(loc.y);
      const z = Math.floor(loc.z + dz);
      cells.push({ x, y, z });
      player.dimension.runCommand(`setblock ${x} ${y} ${z} minecraft:water`);
      player.dimension.runCommand(`setblock ${x} ${y + 1} ${z} minecraft:water`);
    }
  }

  setTimeout(() => {
    for (const cell of cells) {
      player.dimension.runCommand(`setblock ${cell.x} ${cell.y} ${cell.z} minecraft:air`);
      player.dimension.runCommand(`setblock ${cell.x} ${cell.y + 1} ${cell.z} minecraft:air`);
    }
  }, 10000);
}

// ===============================
// 7. Lava
// ===============================
function castLava(player) {
  const loc = player.location;
  const dir = player.getViewDirection();

  const x = loc.x + dir.x * 8;
  const y = loc.y + dir.y * 8 + 1;
  const z = loc.z + dir.z * 8;

  player.dimension.runCommand(`summon small_fireball ${loc.x} ${loc.y + 1} ${loc.z} {direction:[${dir.x},${dir.y},${dir.z}]}`);
  player.dimension.runCommand(`particle minecraft:lava_particle ${x} ${y} ${z}`);

  setTimeout(() => {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const px = Math.floor(x + dx);
        const pz = Math.floor(z + dz);
        player.dimension.runCommand(`setblock ${px} ${Math.floor(y - 1)} ${pz} minecraft:lava`);
      }
    }
  }, 350);
}

// ===============================
// 8. Meteor Magma
// ===============================
function castMeteorMagma(player) {
  const target = getForwardTarget(player, 20);

  for (let i = 0; i < 5; i++) {
    const px = target.x + (Math.random() - 0.5) * 4;
    const pz = target.z + (Math.random() - 0.5) * 4;
    const py = target.y + 16 + i * 2;

    player.dimension.runCommand(`setblock ${Math.floor(px)} ${Math.floor(py)} ${Math.floor(pz)} minecraft:magma_block`);

    setTimeout(() => {
      player.dimension.runCommand(`setblock ${Math.floor(px)} ${Math.floor(target.y + 1)} ${Math.floor(pz)} minecraft:magma_block`);
      player.dimension.runCommand(`particle minecraft:lava_particle ${px} ${target.y + 2} ${pz}`);
      player.dimension.runCommand(`particle minecraft:explosion ${px} ${target.y + 2} ${pz}`);
    }, 1400 + i * 220);
  }
}

// ===============================
// 9. Tornado (pull nearby entities)
// ===============================
function castTornado(player) {
  const loc = player.location;
  const radius = 6;

  const entities = player.dimension.getEntities({
    location: { x: loc.x, y: loc.y, z: loc.z },
    maxDistance: radius,
  });

  for (const entity of entities) {
    if (entity.id === player.id) continue;

    const pos = entity.location;
    player.dimension.runCommand(`particle minecraft:totem_particle ${pos.x} ${pos.y + 1} ${pos.z}`);
    entity.teleport(
      { x: pos.x, y: pos.y + 4, z: pos.z },
      { x: 0, y: 0, z: 0 },
      false,
    );
  }
}

// ===============================
// Chat magic trigger (aliases)
// ===============================
server.world.events.beforeChat.subscribe((event) => {
  const { message, sender } = event;
  if (!sender) return;

  const cmd = message.trim().toLowerCase();
  if (cmd === "!fire") {
    event.cancel = true;
    castFire(sender);
  } else if (cmd === "!earth") {
    event.cancel = true;
    castEarth(sender);
  } else if (cmd === "!quake") {
    event.cancel = true;
    castQuake(sender);
  } else if (cmd === "!air") {
    event.cancel = true;
    castAir(sender);
  } else if (cmd === "!tsunami") {
    event.cancel = true;
    castTsunami(sender);
  } else if (cmd === "!flood") {
    event.cancel = true;
    castFlood(sender);
  } else if (cmd === "!lava") {
    event.cancel = true;
    castLava(sender);
  } else if (cmd === "!meteor") {
    event.cancel = true;
    castMeteorMagma(sender);
  } else if (cmd === "!tornado") {
    event.cancel = true;
    castTornado(sender);
  }
});

console.log("Magic addon initialized.");
