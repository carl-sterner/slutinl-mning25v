const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


let angle = 0;
let mouseX = 0;
let mouseY = 0;

let bullets = [];
let zombies = [];
let x = canvas.width/2;
let y = canvas.height/2;
let dx = 0;
let dy = 0;
let maxHp = 10;
let hp = maxHp;
let invincibleTime = 0;
let reloadTime = 0;
let isReloading = false;
let isHoldingMouseDown = false;
let isOnShootingCooldown = false;
let currentShootingCooldown = 0;
let money = 0;
let paused = false;
let killCount = 0;
let currentWave = 1;
let zombiesInWave = 10;
let zombiesSpawned = 0;
let playerSpeed = 5;
let playerDamageReduction = 0;


let particles = [];


let powerUps = [];
const powerUpTypes = [
    { name: 'Health', color: '#22c55e', effect: () => { hp = Math.min(maxHp, hp + 3); showNotification('Health restored!'); } },
    { name: 'Ammo', color: '#f97316', effect: () => { mag = maxMag; showNotification('Ammo refilled!'); } },
    { name: 'Speed', color: '#3b82f6', duration: 10000, effect: () => { 
        playerSpeed = 8; 
        showNotification('Speed boost for 10 seconds!');
        setTimeout(() => { playerSpeed = 5; }, 10000);
    } },
    { name: 'Damage', color: '#ef4444', duration: 10000, effect: () => {
        let originalDamages = {};
        weapons.forEach(w => { originalDamages[w.name] = w.damage; w.damage *= 2; });
        showNotification('Double damage for 10 seconds!');
        setTimeout(() => {
            weapons.forEach(w => { w.damage = originalDamages[w.name]; });
        }, 10000);
    }}
];


let weapons = [ 
    {
        name: 'M4',
        fire: 'fullauto',
        mag: 30,
        damage: 25,
        fireRate: 100, 
        reloadTime: 2000, 
        range: 600, 
        accuracy: 0.9,
        bulletSpeed: 800,
        type: 'rifle',
        icon: 'M4'
    },
    {
        name: 'AK-47',
        fire: 'fullauto',
        mag: 30,
        damage: 30,
        fireRate: 60,
        reloadTime: 2500,
        range: 550,
        accuracy: 0.96,
        bulletSpeed: 1750,
        type: 'rifle',
        icon: 'AK'
    },
    {
        name: 'MP5',
        fire: 'fullauto',
        mag: 40,
        damage: 20,
        fireRate: 80,
        reloadTime: 1800,
        range: 400,
        accuracy: 0.88,
        bulletSpeed: 700,
        type: 'smg',
        icon: 'MP'
    },
    {
        name: 'Desert Eagle',
        fire: 'semi',
        mag: 7,
        damage: 50,
        fireRate: 20,
        reloadTime: 2200,
        range: 300,
        accuracy: 0.95,
        bulletSpeed: 600,
        type: 'pistol',
        icon: 'DE'
    },
    {
        name: 'Shotgun',
        fire: 'pump',
        mag: 8,
        damage: 100,
        pellets: 6,
        fireRate: 300,
        reloadTime: 3000,
        range: 200,
        accuracy: 0.8,
        bulletSpeed: 3000,
        type: 'shotgun',
        icon: 'SG'
    },
    {
        name: 'Sniper Rifle',
        fire: 'bolt',
        mag: 5,
        damage: 90,
        fireRate: 1000,
        reloadTime: 3000,
        range: 1000,
        accuracy: 0.99,
        bulletSpeed: 1000,
        type: 'sniper',
        icon: 'SR'
    },
    {
        name: 'Rocket Launcher',
        fire: 'single',
        mag: 1,
        damage: 100,
        splashRadius: 100,
        fireRate: 1500,
        reloadTime: 3500,
        range: 700,
        accuracy: 0.8,
        bulletSpeed: 400,
        type: 'explosive',
        icon: 'RL'
    }
];
let unlockedWeapons = ["Desert Eagle", "M4", "AK-47", "Shotgun", "Sniper Rifle", "Rocket Launcher"];

let selectedWeapon = localStorage.getItem('selectedWeapon') ? localStorage.getItem('selectedWeapon') : "Desert Eagle";

let weapon = weapons.find(w => w.name === selectedWeapon);
let mag = weapon.mag;
let maxMag = weapon.mag;


let obstacles = [
    { x: 200, y: 200, width: 100, height: 20 },
    { x: 400, y: 400, width: 20, height: 100 },
    { x: 600, y: 300, width: 150, height: 150 }
];


function init() {

    updateWeaponSelectUI();
    updateAmmoDisplay();
    updateUIElements();
    

    startWave(1);
}

function startWave(waveNumber) {
    currentWave = waveNumber;
    zombiesInWave = 10 + (waveNumber * 5);
    zombiesSpawned = 0;
    

    const waveNotification = document.getElementById('waveNotification');
    waveNotification.textContent = `wave ${waveNumber}`;
    waveNotification.classList.add('show');
    
    setTimeout(() => {
        waveNotification.classList.remove('show');
    }, 2000);
    
    document.getElementById('waveCount').textContent = waveNumber;
}

function spawnZombie() {
    if (zombiesSpawned >= zombiesInWave) return;
    
    let edge = Math.floor(Math.random() * 4);
    let posX, posY;
    
    if (edge === 0) { 
        posX = Math.random() * canvas.width;
        posY = -50;
    } else if (edge === 1) {
        posX = canvas.width+50;
        posY = Math.random() * canvas.height;
    } else if (edge === 2) { 
        posX = Math.random() * canvas.width;
        posY = canvas.height+50;
    } else if (edge === 3) {
        posX = -50;
        posY = Math.random() * canvas.height;
    }
    

    let zombieType = 'normal';
    let zombieHp = 100;
    let zombieSpeed = 2;
    let zombieColor = '#3f6212';
    

    if (currentWave >= 3) {
        const typeRoll = Math.random();
        if (typeRoll > 0.9) {
            zombieType = 'tank';
            zombieHp = 300;
            zombieSpeed = 1;
            zombieColor = '#854d0e';
        } else if (typeRoll > 0.7) {
            zombieType = 'runner';
            zombieHp = 60;
            zombieSpeed = 3.5;
            zombieColor = '#65a30d';
        }
    }
    
    zombies.push({ 
        posX, 
        posY, 
        hp: zombieHp, 
        maxHp: zombieHp,
        type: zombieType,
        speed: zombieSpeed,
        color: zombieColor,
        angle: 0,
        size: zombieType === 'tank' ? 60 : 40,
        attackCooldown: 0
    });
    
    zombiesSpawned++;
}

function lerpAngle(a, b, t) {
    let diff = b - a;

    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;

    return a + diff * t;
}

function createBloodSplatter(x, y, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2;
        particles.push({
            x: x,
            y: y,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            radius: 1 + Math.random() * 3,
            color: '#ef4444',
            life: 30 + Math.random() * 30
        });
    }
}

function createExplosion(x, y, radius) {

    for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        particles.push({
            x: x,
            y: y,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            radius: 2 + Math.random() * 4,
            color: i % 3 === 0 ? '#ef4444' : (i % 3 === 1 ? '#f97316' : '#fcd34d'),
            life: 20 + Math.random() * 40
        });
    }
    

    zombies.forEach((zombie, zIndex) => {
        const dist = Math.sqrt((zombie.posX - x) ** 2 + (zombie.posY - y) ** 2);
        if (dist < radius) {
            const damage = Math.floor(100 * (1 - dist/radius));
            if (zombie.hp <= damage) {
                createBloodSplatter(zombie.posX, zombie.posY, 20);
                zombies.splice(zIndex, 1);
                money += zombie.type === 'tank' ? 30 : (zombie.type === 'runner' ? 15 : 10);
                killCount++;

                if (Math.random() < 0.1) {
                    spawnPowerUp(zombie.posX, zombie.posY);
                }
            } else {
                zombie.hp -= damage;
                createBloodSplatter(zombie.posX, zombie.posY, 5);
            }
        }
    });
}

function spawnPowerUp(x, y) {
    const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    powerUps.push({
        x: x,
        y: y,
        type: type,
        radius: 15,
        pulsating: 0
    });
}

function shoot() {
    const weapon = weapons.find(w => w.name === selectedWeapon);

    if (mag === 0) {
        if (!isReloading) {
            isReloading = true;
            reloadTime = weapon.reloadTime / 10; 
            document.getElementById('reloadIndicator').style.display = 'block';
        }
        return;
    }

    const direction = Math.atan2(mouseY - y, mouseX - x);
    const inaccuracy = (1 - weapon.accuracy) * (Math.random() - 0.5);
    const angleOffset = inaccuracy * Math.PI;

    const finalAngle = direction + angleOffset;
    const speed = weapon.bulletSpeed / 60;

    if (weapon.type === 'shotgun') {
        for (let i = 0; i < weapon.pellets; i++) {
            const pelletAngle = finalAngle + ((Math.random() - 0.5) * (1 - weapon.accuracy));
            bullets.push({
                x: x,
                y: y,
                dx: Math.cos(pelletAngle) * speed,
                dy: Math.sin(pelletAngle) * speed,
                damage: weapon.damage / weapon.pellets,
                range: weapon.range,
                distanceTraveled: 0,
                type: weapon.type
            });
        }
    } else if (weapon.type === 'explosive') {
        bullets.push({
            x: x,
            y: y,
            dx: Math.cos(finalAngle) * speed,
            dy: Math.sin(finalAngle) * speed,
            damage: weapon.damage,
            range: weapon.range,
            distanceTraveled: 0,
            type: weapon.type,
            splashRadius: weapon.splashRadius
        });
    } else {
        bullets.push({
            x: x,
            y: y,
            dx: Math.cos(finalAngle) * speed,
            dy: Math.sin(finalAngle) * speed,
            damage: weapon.damage,
            range: weapon.range,
            distanceTraveled: 0,
            type: weapon.type
        });
    }

    mag--;
    currentShootingCooldown = weapon.fireRate / 10;
    isOnShootingCooldown = true;
    
    updateAmmoDisplay();
}

function unlockWeapon(weaponName) {
    const weapon = weapons.find(w => w.name === weaponName);
    if (!weapon) return;
    

    if (unlockedWeapons.includes(weaponName)) {
        showNotification('You already own this weapon!');
        return;
    }
    

    const prices = {
        'AK-47': 500,
        'MP5': 400,
        'Shotgun': 600,
        'M4': 450,
        'Sniper Rifle': 800,
        'Rocket Launcher': 1000
    };
    
    const price = prices[weaponName];
    if (money >= price) {
        money -= price;
        unlockedWeapons.push(weaponName);
        selectedWeapon = weaponName;
        

        weapon = weapons.find(w => w.name === selectedWeapon);
        mag = weapon.mag;
        maxMag = weapon.mag;
        

        updateWeaponSelectUI();
        updateAmmoDisplay();
        updateUIElements();
        

        localStorage.setItem('selectedWeapon', selectedWeapon);
        localStorage.setItem('unlockedWeapons', JSON.stringify(unlockedWeapons));
        
        showNotification(`Purchased ${weaponName}!`);
        document.getElementById('store').style.display = 'none';
    } else {
        showNotification(`Not enough money! Need $${price}`);
    }
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function updateWeaponSelectUI() {
    const weaponSelect = document.getElementById('weaponSelect');
    weaponSelect.innerHTML = '';
    
    unlockedWeapons.forEach((weaponName, index) => {
        const weapon = weapons.find(w => w.name === weaponName);
        const slot = document.createElement('div');
        slot.className = 'weapon-slot';
        if (weaponName === selectedWeapon) {
            slot.classList.add('active');
        }
        slot.dataset.weapon = weaponName;
        slot.innerHTML = `
            <span>${weapon.icon}</span>
            <span class="key">${index + 1}</span>
        `;
        
        slot.addEventListener('click', () => {
            selectedWeapon = weaponName;
            weapon = weapons.find(w => w.name === selectedWeapon);
            mag = weapon.mag;
            maxMag = weapon.mag;
            updateAmmoDisplay();
            updateUIElements();
            

            document.querySelectorAll('.weapon-slot').forEach(s => s.classList.remove('active'));
            slot.classList.add('active');
            
            localStorage.setItem('selectedWeapon', selectedWeapon);
        });
        
        weaponSelect.appendChild(slot);
    });
}

function updateAmmoDisplay() {
    const ammoDisplay = document.getElementById('ammoDisplay');
    ammoDisplay.innerHTML = '';
    
    for (let i = 0; i < maxMag; i++) {
        const bullet = document.createElement('div');
        bullet.className = i < mag ? 'ammo-bullet' : 'ammo-bullet empty';
        ammoDisplay.appendChild(bullet);
    }
}

function updateUIElements() {
    document.getElementById('weaponNameDisplay').textContent = selectedWeapon;
    document.getElementById('moneyDisplay').textContent = `$${money}`;
    document.getElementById('storeMoneyDisplay').textContent = `$${money}`;
    document.getElementById('healthFill').style.width = `${(hp / maxHp) * 100}%`;
}

function checkCollision(x, y, obstacles, returnObstacle=false) {
    for (let obs of obstacles) {
        if (x >= obs.x && x <= obs.x + obs.width &&
            y >= obs.y && y <= obs.y + obs.height) {
                if(returnObstacle){
                    return obs
                }else{
                    return true;
                }
        }
    }
    return false;
}

function restartGame() {
    hp = maxHp;
    x = canvas.width / 2;
    y = canvas.height / 2;
    bullets = [];
    zombies = [];
    particles = [];
    powerUps = [];
    money = 0;
    killCount = 0;
    

    if (unlockedWeapons.includes("Desert Eagle")) {
        selectedWeapon = "Desert Eagle";
        weapon = weapons.find(w => w.name === selectedWeapon);
        mag = weapon.mag;
        maxMag = weapon.mag;
    }
    
    document.getElementById('gameOver').style.display = 'none';
    startWave(1);
    updateUIElements();
    updateAmmoDisplay();
    updateWeaponSelectUI();
}

function gameOver() {
    document.getElementById('finalWaveCount').textContent = currentWave;
    document.getElementById('finalKillCount').textContent = killCount;
    document.getElementById('finalMoneyCount').textContent = `$${money}`;
    document.getElementById('gameOver').style.display = 'flex';
}


const update = () => {
    if (!paused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        

        if (Math.random() < 0.05 && zombiesSpawned < zombiesInWave) {
            spawnZombie();
        }
        

        if (zombies.length === 0 && zombiesSpawned >= zombiesInWave) {
            currentWave++;
            startWave(currentWave);
        }
        

        bullets.forEach((bullet, bulletIndex) => {
            bullet.x += bullet.dx;
            bullet.y += bullet.dy;
            

            bullet.distanceTraveled += Math.sqrt(bullet.dx * bullet.dx + bullet.dy * bullet.dy);
            

            if (bullet.distanceTraveled > bullet.range) {

                if (bullet.type === 'explosive') {
                    createExplosion(bullet.x, bullet.y, bullet.splashRadius);
                }
                bullets.splice(bulletIndex, 1);
                return;
            }
            

            if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
                bullets.splice(bulletIndex, 1);
                return;
            }
            

            if (checkCollision(bullet.x, bullet.y, obstacles)) {
                if (bullet.type === 'explosive') {
                    createExplosion(bullet.x, bullet.y, bullet.splashRadius);
                }
                bullets.splice(bulletIndex, 1);
                return;
            }
            

            zombies.forEach((zombie, zombieIndex) => {
                const distance = Math.sqrt((bullet.x - zombie.posX) ** 2 + (bullet.y - zombie.posY) ** 2);
                
                if (distance < zombie.size / 2) {
                    if (bullet.type === 'explosive') {
                        createExplosion(bullet.x, bullet.y, bullet.splashRadius);
                    } else {

                        zombie.hp -= bullet.damage;
                        

                        createBloodSplatter(bullet.x, bullet.y, 5);
                        

                        if (zombie.hp <= 0) {
                            createBloodSplatter(zombie.posX, zombie.posY, 20);
                            zombies.splice(zombieIndex, 1);
                            

                            money += zombie.type === 'tank' ? 30 : (zombie.type === 'runner' ? 15 : 10);
                            killCount++;
                            

                            if (Math.random() < 0.1) {
                                spawnPowerUp(zombie.posX, zombie.posY);
                            }
                            
                            updateUIElements();
                        }
                    }
                    
                    bullets.splice(bulletIndex, 1);
                    return;
                }
            });
        });
        

        zombies.forEach((zombie, index) => {

            let dx = x - zombie.posX;
            let dy = y - zombie.posY;
            

            let length = Math.sqrt(dx * dx + dy * dy);
            if (length !== 0) {
                dx /= length;
                dy /= length;
            }
            

            const potentialX = zombie.posX + dx * zombie.speed;
            const potentialY = zombie.posY + dy * zombie.speed;
            
            if (!checkCollision(potentialX, zombie.posY, obstacles)) {
                zombie.posX = potentialX;
            } else {

                zombie.posX += dy * zombie.speed;
            }
            
            if (!checkCollision(zombie.posX, potentialY, obstacles)) {
                zombie.posY = potentialY;
            } else {

                zombie.posY += dx * zombie.speed;
            }
            

            let targetAngle = Math.atan2(y - zombie.posY, x - zombie.posX);
            if (zombie.angle === undefined) zombie.angle = targetAngle;
            zombie.angle = lerpAngle(zombie.angle, targetAngle, 0.1);
            

            let distanceToPlayer = Math.sqrt((x - zombie.posX) ** 2 + (y - zombie.posY) ** 2);
            let hitRadius = zombie.size / 2;
            
            if (distanceToPlayer < hitRadius) {
                if (invincibleTime === 0 && zombie.attackCooldown === 0) {

                    const damageDealt = zombie.type === 'tank' ? 2 : 1;
                    const finalDamage = Math.max(1, Math.floor(damageDealt * (1 - playerDamageReduction)));
                    
                    hp -= finalDamage;
                    invincibleTime = 30;
                    zombie.attackCooldown = 60;
                    

                    createBloodSplatter(x, y, 10);
                    

                    updateUIElements();
                    

                    if (hp <= 0) {
                        gameOver();
                    }
                }
            }
            

            if (zombie.attackCooldown > 0) {
                zombie.attackCooldown--;
            }
        });
        

        particles.forEach((particle, i) => {
            particle.x += particle.dx;
            particle.y += particle.dy;
            particle.life--;
            
            if (particle.life <= 0) {
                particles.splice(i, 1);
            }
        });
        

        powerUps.forEach((powerUp, i) => {
            powerUp.pulsating = (powerUp.pulsating + 0.05) % (Math.PI * 2);
            

            const distance = Math.sqrt((x - powerUp.x) ** 2 + (y - powerUp.y) ** 2);
            if (distance < 30) {
                powerUp.type.effect();
                powerUps.splice(i, 1);
            }
        });
        
        const nextX = x + dx * playerSpeed;
        const nextY = y + dy * playerSpeed;

        const playerHalfWidth = 20;
        const playerHalfHeight = 20;

        const playerLeft = nextX - playerHalfWidth;
        const playerRight = nextX + playerHalfWidth;
        const playerTop = nextY - playerHalfHeight;
        const playerBottom = nextY + playerHalfHeight;

        let collisionX = false;
        let collisionY = false;

        for (const obstacle of obstacles) {
            const obstacleLeft = obstacle.x;
            const obstacleRight = obstacle.x + obstacle.width;
            const obstacleTop = obstacle.y;
            const obstacleBottom = obstacle.y + obstacle.height;
            
            if (dx !== 0 &&                                                                                                                                                                                 
                
                playerBottom > obstacleTop && 
                playerTop < obstacleBottom && 
                ((dx > 0 && playerRight > obstacleLeft && playerRight - playerHalfWidth < obstacleLeft) || 
                (dx < 0 && playerLeft < obstacleRight && playerLeft + playerHalfWidth > obstacleRight))) {
                collisionX = true;
            }
            
            if (dy !== 0 && 
                playerRight > obstacleLeft && 
                playerLeft < obstacleRight && 
                ((dy > 0 && playerBottom > obstacleTop && playerBottom - playerHalfHeight < obstacleTop) || 
                (dy < 0 && playerTop < obstacleBottom && playerTop + playerHalfHeight > obstacleBottom))) {
                collisionY = true;
            }
        }

        if (!collisionX) {
            x = nextX;
        }

        if (!collisionY) {
            y = nextY;
        }

        x = Math.max(playerHalfWidth, Math.min(x, canvas.width - playerHalfWidth));
        y = Math.max(playerHalfHeight, Math.min(y, canvas.height - playerHalfHeight));
        
        if (invincibleTime > 0) {
            invincibleTime--;
        }
        

        if (isReloading) {
            reloadTime--;
            if (reloadTime <= 0) {
                isReloading = false;
                const currentWeapon = weapons.find(w => w.name === selectedWeapon);
                mag = currentWeapon.mag;
                maxMag = currentWeapon.mag;
                updateAmmoDisplay();
                document.getElementById('reloadIndicator').style.display = 'none';
            }
        }
        

        if (isOnShootingCooldown) {
            currentShootingCooldown--;
            if (currentShootingCooldown <= 0) {
                isOnShootingCooldown = false;
            }
        }
        

        if (isHoldingMouseDown) {
            if (!isOnShootingCooldown && !isReloading) {
                const currentWeapon = weapons.find(w => w.name === selectedWeapon);
                if (currentWeapon.fire === 'fullauto') {
                    shoot();
                }
            }
        }
        

    }
    
    render();
    requestAnimationFrame(update);
};

function render() {

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    for (let i = 0; i < canvas.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    
    for (let i = 0; i < canvas.height; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
    

    ctx.fillStyle = '#475569';
    obstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });
    

    bullets.forEach(bullet => {
        if (bullet.type === 'explosive') {
            ctx.fillStyle = '#f97316';
        } else if (bullet.type === 'shotgun') {
            ctx.fillStyle = '#fed7aa';
        } else if (bullet.type === 'sniper') {
            ctx.fillStyle = '#bfdbfe';
        } else {
            ctx.fillStyle = '#fcd34d';
        }
        
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.type === 'explosive' ? 8 : 3, 0, Math.PI * 2);
        ctx.fill();
    });
    

    particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / 60;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
    

    powerUps.forEach(powerUp => {
        const pulseScale = 1 + 0.2 * Math.sin(powerUp.pulsating);
        
        ctx.fillStyle = powerUp.type.color;
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, powerUp.radius * pulseScale, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, powerUp.radius * pulseScale, 0, Math.PI * 2);
        ctx.stroke();
        

        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let icon = '';
        if (powerUp.type.name === 'Health') icon = '+';
        else if (powerUp.type.name === 'Ammo') icon = '∞';
        else if (powerUp.type.name === 'Speed') icon = '→';
        else if (powerUp.type.name === 'Damage') icon = '!';
        
        ctx.fillText(icon, powerUp.x, powerUp.y);
    });
    

    zombies.forEach(zombie => {
        ctx.save();
        ctx.translate(zombie.posX, zombie.posY);
        ctx.rotate(zombie.angle);
        

        ctx.fillStyle = zombie.color;
        ctx.fillRect(-zombie.size/2, -zombie.size/2, zombie.size, zombie.size);
        

        ctx.fillStyle = '#4d7c0f';
        ctx.fillRect(-zombie.size/4, -zombie.size/4, zombie.size/2, zombie.size/2);
        

        ctx.fillStyle = zombie.color;
        ctx.fillRect(-zombie.size/2, -zombie.size/6, -zombie.size/4, zombie.size/3);
        ctx.fillRect(zombie.size/2, -zombie.size/6, zombie.size/4, zombie.size/3);
        
        ctx.restore();
        

        if (zombie.hp < zombie.maxHp) {
            const barWidth = zombie.size;
            const barHeight = 5;
            const healthPercent = zombie.hp / zombie.maxHp;
            
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(zombie.posX - barWidth/2, zombie.posY - zombie.size/2 - 10, barWidth, barHeight);
            
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(zombie.posX - barWidth/2, zombie.posY - zombie.size/2 - 10, barWidth * healthPercent, barHeight);
        }
    });
    

    if (invincibleTime === 0 || Math.floor(invincibleTime / 5) % 2 === 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        

        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(-20, -20, 40, 40);
        

        ctx.fillStyle = '#475569';
        
        const currentWeapon = weapons.find(w => w.name === selectedWeapon);
        let barrelLength = 30;
        let barrelWidth = 8;
        
        if (currentWeapon.type === 'shotgun') {
            barrelLength = 35;
            barrelWidth = 10;
        } else if (currentWeapon.type === 'sniper') {
            barrelLength = 45;
            barrelWidth = 6;
        } else if (currentWeapon.type === 'explosive') {
            barrelLength = 40;
            barrelWidth = 12;
        }
        
        ctx.fillRect(15, -barrelWidth/2, barrelLength, barrelWidth);
        
        ctx.restore();
    }
}


document.addEventListener('mousemove', function (event) {
    if (!paused) {
        const rect = canvas.getBoundingClientRect();
        const mouseCanvasX = event.clientX - rect.left;
        const mouseCanvasY = event.clientY - rect.top;
    
        mouseX = mouseCanvasX;
        mouseY = mouseCanvasY;
    
        angle = Math.atan2(mouseY - y, mouseX - x);
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        paused = !paused;

        if (paused) {
            document.getElementById('pauseMenu').style.display = 'flex';
        } else {
            document.getElementById('pauseMenu').style.display = 'none';
            document.getElementById('store').style.display = 'none';
        }
    }
    
    if (paused) return;
    
    if (event.key === 'ArrowUp' || event.key === 'w') {
        dy = -1;
    }
    if (event.key === 'ArrowDown' || event.key === 's') {
        dy = 1;
    }
    if (event.key === 'ArrowRight' || event.key === 'd') {
        dx = 1;
    }
    if (event.key === 'ArrowLeft' || event.key === 'a') {
        dx = -1;
    }
    

    if (event.key === 'r' && !isReloading) {
        isReloading = true;
        reloadTime = weapons.find(w => w.name === selectedWeapon).reloadTime / 10;
        document.getElementById('reloadIndicator').style.display = 'block';
    }
    

    const keyNumber = parseInt(event.key);
    if (!isNaN(keyNumber) && keyNumber >= 1 && keyNumber <= 7) {
        const index = keyNumber - 1;
        if (index < unlockedWeapons.length) {
            selectedWeapon = unlockedWeapons[index];
            weapon = weapons.find(w => w.name === selectedWeapon);
            mag = weapon.mag;
            maxMag = weapon.mag;
            


            updateAmmoDisplay();
            updateUIElements();
            updateWeaponSelectUI();
            
            localStorage.setItem('selectedWeapon', selectedWeapon);
        }
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowUp' || event.key === 'w') {
        dy = 0;
    }
    if (event.key === 'ArrowDown' || event.key === 's') {
        dy = 0;
    }
    if (event.key === 'ArrowRight' || event.key === 'd') {
        dx = 0;
    }
    if (event.key === 'ArrowLeft' || event.key === 'a') {
        dx = 0;
    }
});

canvas.addEventListener('mousedown', (event) => {
    if (!paused && event.button === 0) {
        const currentWeapon = weapons.find(w => w.name === selectedWeapon);
        
        if (!isOnShootingCooldown && !isReloading) {
            shoot();
            
            if (currentWeapon.fire === 'fullauto') {
                isHoldingMouseDown = true;
            }
        }
    }
});

canvas.addEventListener('mouseup', (event) => {
    if (event.button === 0) {
        isHoldingMouseDown = false;
    }
});

canvas.addEventListener('mouseleave', () => {
    isHoldingMouseDown = false;
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});


if (localStorage.getItem('unlockedWeapons')) {
    try {
        const savedWeapons = JSON.parse(localStorage.getItem('unlockedWeapons'));
        if (Array.isArray(savedWeapons) && savedWeapons.length > 0) {
            unlockedWeapons = savedWeapons;
        }
    } catch (e) {
        console.error("Error loading saved weapons:", e);
    }
}


init();
update();