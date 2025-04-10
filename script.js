// const canvas = document.getElementById('canvas');
// const ctx = canvas.getContext('2d')
// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight
// let x = 100;
// let y = 0;
// let dx = 0;
// let dy = 1;
// let g = 0.3;

// let boxs = []
// let died = false

// const update = () => {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     dy += g;

//     document.addEventListener('keydown', (event) => {
//         if(event.key == 'ArrowUp'){
//             dy = -7
//         }
//     })

//     console.log(boxs)
    
//     if(boxs.length < 15){
//         let rnd = Math.random()
//         let _h = Math.random()*550
//         boxs.push({
//             posX: boxs.length > 0 ? boxs[boxs.length-1].posX+200 : 400,
//             posY: rnd >= 0.5 ? 0 : canvas.height,
//             h: _h
//         })
//         boxs.push({
//             posX: boxs[boxs.length-1].posX,
//             posY: rnd >= 0.5 ? canvas.height : 0,
//             h: 550-_h
//         })
//     }
//     boxs.forEach((box, index) => {
//         if(!died)
//             boxs[index].posX -= 2

//         if(box.posX < x+20 && (box.posY == 0 ? box.h > y : box.posY-box.h < y) && (box.posX+50 > x)){
//             died = true
//         }

//         if(box.posX < -50){
//             boxs[index].posX = canvas.width
//         }
//     })
    
//     if(!died)
//         y += dy;
//     render()
//     requestAnimationFrame(update);
// }
// const render = () => {
//     ctx.fillStyle = "#575757";
//     ctx.fillRect(x, y, 20, 20)

//     boxs.forEach(box => {
//         ctx.fillRect(box.posX, box.posY == 0 ? box.posY : box.posY-box.h, 50, box.h)
//     })
    
// }
// update(); 
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let angle = 0;
let mouseX = 0;
let mouseY = 0;

let bullets = [];
let d = [];
let x = canvas.width/2
let y = canvas.height/2 
let dx = 0
let dy = 0
let hp = 10
let invincibleTime = 0
let reloadTime=0
let isReloading = false
let weapons = [ 
    {
        name: 'M4',
        fire: 'fullauto',
        mag: 30,
        damage: 25,
        fireRate: 100, // milliseconds between shots
        reloadTime: 2000, // ms
        range: 600, // px
        accuracy: 0.9, // 0 to 1
        bulletSpeed: 800, // px/sec
        type: 'rifle'
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
        bulletSpeed: 750,
        type: 'rifle'
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
        type: 'smg'
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
        type: 'pistol'
    },
    {
        name: 'Shotgun',
        fire: 'pump',
        mag: 8,
        damage: 10, // per pellet
        pellets: 6,
        fireRate: 700,
        reloadTime: 3000,
        range: 200,
        accuracy: 0.6,
        bulletSpeed: 500,
        type: 'shotgun'
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
        type: 'sniper'
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
        type: 'explosive'
    }
];
let unlockedWeapons = ["Desert Eagle"]

let selectedWeapon = localStorage.getItem('selectedWeapon') ? localStorage.getItem('selectedWeapon') : "Desert Eagle"

let weapon = weapons.find(w => w.name === selectedWeapon);
let mag = weapon.mag;
let maxMag = weapon.mag;

let isHoldingMouseDown = false
let isOnShootingCooldown = false
let currentShootingCooldown = 0

setInterval(() => {
    if (d.length > 10) return;

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

    d.push({ posX, posY, hp:100 });
}, 1000);

function lerpAngle(a, b, t) {
    let diff = b - a;

    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;

    return a + diff * t;
}

function shoot(){
    const weapon = weapons.find(w => w.name === selectedWeapon);

    if(mag == 0){
        if(!isReloading){
            isReloading = true;
            reloadTime = weapon.reloadTime / 10; // scale down for game loop tick
        }
        return;
    }

    const direction = Math.atan2(mouseY - y, mouseX - x);
    const inaccuracy = (1 - weapon.accuracy) * (Math.random() - 0.5);
    const angleOffset = inaccuracy * Math.PI;

    const angle = direction + angleOffset;
    const speed = weapon.bulletSpeed / 60; // convert to per-frame

    // For shotguns
    if (weapon.type === 'shotgun') {
        for (let i = 0; i < weapon.pellets; i++) {
            const pelletAngle = angle + ((Math.random() - 0.5) * (1 - weapon.accuracy));
            bullets.push({
                x: x,
                y: y,
                dx: Math.cos(pelletAngle) * speed,
                dy: Math.sin(pelletAngle) * speed,
                damage: weapon.damage
            });
        }
    } else {
        bullets.push({
            x: x,
            y: y,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            damage: weapon.damage
        });
    }

    mag--;
    currentShootingCooldown = weapon.fireRate / 10; // scale for loop ticks
    isOnShootingCooldown = true;
}


const update = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    bullets.forEach((bullet, bulletIndex) => {
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;
    
        if (
            bullet.x < 0 || bullet.x > canvas.width ||
            bullet.y < 0 || bullet.y > canvas.height
        ) {
            bullets.splice(bulletIndex, 1);
        }
    
        d.forEach((_d, dIndex) => {
            let distance = Math.sqrt((bullet.x - _d.posX) ** 2 + (bullet.y - _d.posY) ** 2);
    
            let hitRadius = 50;
            if (distance < hitRadius) {
                bullets.splice(bulletIndex, 1);
                let damage = bullet.damage || weapons.find(w => w.name === selectedWeapon).damage;
                if(d[dIndex].hp <= damage){
                    d.splice(dIndex, 1);
                }else{
                    d[dIndex].hp -= damage;
                }                   
                
            }
        });
    });
    
    d.forEach((_d, index) => {
        let dx = x - _d.posX;
        let dy = y - _d.posY;
    
        let length = Math.sqrt(dx * dx + dy * dy);
        if (length !== 0) {
            dx /= length;
            dy /= length;
        }
    
        let speed = 2;
        _d.posX += dx * speed;
        _d.posY += dy * speed;
    
        let targetAngle = Math.atan2(y - _d.posY, x - _d.posX);
    
        if (_d.angle === undefined) _d.angle = targetAngle;
    
        _d.angle = lerpAngle(_d.angle, targetAngle, 0.1); 

        let distanceToPlayer = Math.sqrt((x-_d.posX)**2 + (y-_d.posY)**2)
        let hitRadius = 50
        if(distanceToPlayer < hitRadius){
            if(invincibleTime == 0){
                hp -=1
                invincibleTime = 30
            }
        }
    });
    
    if(isHoldingMouseDown){
        if(!isOnShootingCooldown){
            shoot();
        }
    }


    x += dx;
    y += dy;

    if(invincibleTime > 0)
        invincibleTime--
    if(isReloading){
        reloadTime--
        if(reloadTime == 0){
            isReloading = false
            let currentWeapon = weapons.find(w => w.name === selectedWeapon);
            mag = currentWeapon.mag;
            maxMag = currentWeapon.mag;
        }
    }
    

    if(isOnShootingCooldown){
        currentShootingCooldown--
        if(currentShootingCooldown <= 0){
            isOnShootingCooldown = false
        }
    }
    console.log(isOnShootingCooldown, currentShootingCooldown)
    render();
    requestAnimationFrame(update);
};

const render = () => {
    ctx.save(); // Save the state before transform
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = "blue";
    ctx.fillRect(-25, -25, 50, 50); // player body
    ctx.fillRect(15, 10, 20, 5);    // gun (relative to rotation)
    ctx.restore(); // Restore the state after transform
    

    ctx.fillStyle = "red";
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    d.forEach(d => {
        ctx.save();
        ctx.translate(d.posX, d.posY)
        ctx.rotate(d.angle)
        ctx.fillRect(-25, -25, 50, 50)
        if(d.hp < 100){
            ctx.rotate(-d.angle)
            ctx.fillStyle='red'
            ctx.fillRect(-25, 30, 50, 10)
            ctx.fillStyle='green'
            ctx.fillRect(-25, 30, d.hp/2, 10)
        }
        ctx.restore()
    })

    let barWidth = canvas.width - 40;
    let barHeight = 20;
    let barX = 20;
    let barY = 20;

    ctx.fillStyle = 'red';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = 'green';
    ctx.fillRect(barX, barY, barWidth * hp/10, barHeight);

    if (hp <= 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    
        ctx.fillStyle = 'white';
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 40);
    
        const buttonWidth = 200;
        const buttonHeight = 60;
        const buttonX = canvas.width / 2 - buttonWidth / 2;
        const buttonY = canvas.height / 2 + 10;
    
        ctx.fillStyle = 'white';
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
        ctx.fillStyle = 'black';
        ctx.font = '28px sans-serif';
        ctx.fillText('Restart', canvas.width / 2, buttonY + 40);
    
        restartButton = { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight };
    }

    ctx.fillStyle='#16181d'
    if(isReloading){
        if (Math.floor(reloadTime / 5) % 2 == 0) {
            for (let i = 0; i < maxMag; i++) {
                ctx.fillRect(10 + (i * 10), canvas.height - 25, 5, 20);
            }
        }
    }
    else{
        for(let i = 0; i < mag; i++){
            ctx.fillRect(10+(i*10), canvas.height-25, 5, 20)
        }
    }
    

};

document.addEventListener('mousemove', function (event) {
    const rect = canvas.getBoundingClientRect();
    const mouseCanvasX = event.clientX - rect.left;
    const mouseCanvasY = event.clientY - rect.top;

    mouseX = mouseCanvasX;
    mouseY = mouseCanvasY;

    angle = Math.atan2(mouseY - y, mouseX - x);
});


document.addEventListener('keydown', (event) => {
    if(event.key == 'ArrowUp' ||event.key == 'w'){
        dy = -7
    }
    if(event.key == 'ArrowDown'||event.key == 's'){
        dy = 7
    }
    if(event.key == 'ArrowRight'||event.key == 'd'){
        dx = 7
    }
    if(event.key == 'ArrowLeft'||event.key == 'a'){
        dx = -7
    }
    

    if(event.key == '1'){
        selectedWeapon = 'AK-47';
        let currentWeapon = weapons.find(w => w.name === selectedWeapon);
        mag = currentWeapon.mag;
        maxMag = currentWeapon.mag;
    }
    

    angle = Math.atan2(mouseY - y, mouseX - x);
})
document.addEventListener('keyup', (event) => {
    if(event.key == 'ArrowUp'||event.key == 'w'){
        dy = 0
    }
    if(event.key == 'ArrowDown'||event.key == 's'){
        dy = 0
    }
    if(event.key == 'ArrowRight'||event.key == 'd'){
        dx = 0
    }
    if(event.key == 'ArrowLeft'||event.key == 'a'){
        dx = 0
    }
})

let restartButton = null;

canvas.addEventListener('click', (e) => {
    if (restartButton && hp <= 0) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (
            mouseX >= restartButton.x &&
            mouseX <= restartButton.x + restartButton.width &&
            mouseY >= restartButton.y &&
            mouseY <= restartButton.y + restartButton.height
        ) {
            hp = 10;
            x = canvas.width / 2;
            y = canvas.height / 2;
            bullets = [];
            d = [];
            mag=30
            restartButton = null;
        }
    }

    
});


document.addEventListener('mousedown', (event) => {
    
    if(!isOnShootingCooldown){
        shoot();
    }
    
    if(weapons.find((weapon) => weapon.name == selectedWeapon)){
        if(weapons.find((weapon) => weapon.name == selectedWeapon).fire == 'fullauto')
            isHoldingMouseDown = true
    }
});

document.addEventListener('mouseup', (event) => {
    isHoldingMouseDown = false
})


update();
