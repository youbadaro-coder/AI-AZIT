const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const scoreEl = document.getElementById('score');
const healthFillEl = document.getElementById('health-fill');
const gameOverScreen = document.getElementById('game-over');
const startScreen = document.getElementById('start-screen');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const startBtn = document.getElementById('start-btn');

// Game State
let gameState = 'START'; // START, PLAYING, GAMEOVER
let score = 0;
let frames = 0;
let keys = {};
let projectiles = [];
let particles = [];
let enemies = [];
let items = [];
let animationId; // Variable to store the requestAnimationFrame ID

// Game Constants
const PLAYER_SPEED = 5;
const BULLET_SPEED = 10;
const ENEMY_SPAWN_RATE = 60; // Frames

// Canvas Resize
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Input Handling
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// --- Classes ---

class Player {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - 100;
        this.color = '#3498db'; // Rambo Body Blue (Jeans?)
        this.hp = 100;
        this.maxHp = 100;
        this.weaponLevel = 1;
        this.lastShot = 0;
        this.faceColor = '#ffeaa7';
        this.headbandColor = '#e74c3c';
    }

    update() {
        // Movement
        if (keys['ArrowLeft'] && this.x > 0) this.x -= PLAYER_SPEED;
        if (keys['ArrowRight'] && this.x < canvas.width - this.width) this.x += PLAYER_SPEED;
        if (keys['ArrowUp'] && this.y > 0) this.y -= PLAYER_SPEED;
        if (keys['ArrowDown'] && this.y < canvas.height - this.height) this.y += PLAYER_SPEED;

        // Shooting
        if (keys['Space']) {
            this.shoot();
        }
    }

    shoot() {
        const now = Date.now();
        const fireRate = 150; // ms

        if (now - this.lastShot > fireRate) {
            this.lastShot = now;

            if (this.weaponLevel === 1) {
                // Single Shot
                projectiles.push(new Projectile(this.x + this.width / 2, this.y, 0, -BULLET_SPEED));
            } else if (this.weaponLevel >= 3) {
                // Triple Shot
                projectiles.push(new Projectile(this.x + this.width / 2, this.y, 0, -BULLET_SPEED)); // Center
                projectiles.push(new Projectile(this.x, this.y, -2, -BULLET_SPEED * 0.9)); // Left spread
                projectiles.push(new Projectile(this.x + this.width, this.y, 2, -BULLET_SPEED * 0.9)); // Right spread
            } else if (this.weaponLevel === 2) {
                // Double Shot
                projectiles.push(new Projectile(this.x + 5, this.y, 0, -BULLET_SPEED));
                projectiles.push(new Projectile(this.x + this.width - 5, this.y, 0, -BULLET_SPEED));
            }
            // Add Triple Shot logic later for higher levels
        }
    }

    draw() {
        // Draw Cute Rambo - Simplified Shapes

        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y + 20, this.width, 20);

        // Head
        ctx.fillStyle = this.faceColor;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + 15, 20, 0, Math.PI * 2);
        ctx.fill();

        // Bandana (Red Headband)
        ctx.fillStyle = this.headbandColor;
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, 10);
        ctx.fill();
        // Bandana knot
        ctx.beginPath();
        ctx.arc(this.x + this.width, this.y + 5, 5, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 12, this.y + 15, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 28, this.y + 15, 3, 0, Math.PI * 2);
        ctx.fill();

        // Gun
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(this.x + 30, this.y + 25, 10, 15);
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        healthFillEl.style.width = `${(this.hp / this.maxHp) * 100}%`;

        if (this.hp <= 0) {
            endGame();
        }
    }
}

class Projectile {
    constructor(x, y, dx, dy) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.radius = 4;
        this.color = '#f1c40f';
        this.markedForDeletion = false;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        if (this.y < 0 || this.y > canvas.height) {
            this.markedForDeletion = true;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class Enemy {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
        this.speed = Math.random() * 2 + 1; // 1 to 3
        this.hp = 3;
        this.color = '#e74c3c'; // Enemy Red
        this.markedForDeletion = false;
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height) this.markedForDeletion = true;
    }

    // Improve Enemy Drawing
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Angry Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 5, this.y + 10, 10, 10);
        ctx.fillRect(this.x + 25, this.y + 10, 10, 10);

        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 8, this.y + 12, 4, 4);
        ctx.fillRect(this.x + 28, this.y + 12, 4, 4);

        // Angry Eyebrows
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + 5, this.y + 8);
        ctx.lineTo(this.x + 15, this.y + 12);
        ctx.moveTo(this.x + 25, this.y + 12);
        ctx.lineTo(this.x + 35, this.y + 8);
        ctx.stroke();
    }
}

class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'WEAPON', 'HEALTH'
        this.width = 30;
        this.height = 30;
        this.speed = 2;
        this.markedForDeletion = false;
        this.wobble = Math.random() * Math.PI * 2;
    }

    update() {
        this.y += this.speed;
        this.wobble += 0.1;
        this.x += Math.sin(this.wobble) * 0.5; // Gentle float effect

        if (this.y > canvas.height) this.markedForDeletion = true;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(Math.sin(this.wobble) * 0.2); // Gentle rotation

        if (this.type === 'WEAPON') {
            // Weapon Upgrade Box
            ctx.fillStyle = '#f39c12'; // Orange
            ctx.fillRect(-15, -15, 30, 30);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('P', 0, 0); // Power up
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(-15, -15, 30, 30);
        } else if (this.type === 'HEALTH') {
            // Health Kit
            ctx.fillStyle = '#fff';
            ctx.fillRect(-15, -15, 30, 30);
            ctx.fillStyle = '#e74c3c'; // Red Cross
            ctx.fillRect(-5, -10, 10, 20);
            ctx.fillRect(-10, -5, 20, 10);
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            ctx.strokeRect(-15, -15, 30, 30);
        }
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 6;
        this.speedY = (Math.random() - 0.5) * 6;
        this.color = color;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.01;
        this.markedForDeletion = false;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        if (this.life <= 0) this.markedForDeletion = true;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

// --- Game Logic ---

let player;

function initGame() {
    player = new Player();
    score = 0;
    frames = 0;
    projectiles = [];
    enemies = [];
    particles = [];
    items = [];
    healthFillEl.style.width = '100%';
    scoreEl.innerText = '0';

    if (animationId) cancelAnimationFrame(animationId); // Stop any previous loop
    gameState = 'PLAYING';
    animate();
}

function spawnEnemies() {
    if (frames % 60 === 0) {
        enemies.push(new Enemy());
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 12; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function checkCollisions() {
    // Projectiles hit Enemies
    projectiles.forEach(projectile => {
        enemies.forEach(enemy => {
            if (
                !projectile.markedForDeletion &&
                !enemy.markedForDeletion &&
                projectile.x > enemy.x &&
                projectile.x < enemy.x + enemy.width &&
                projectile.y > enemy.y &&
                projectile.y < enemy.y + enemy.height
            ) {
                projectile.markedForDeletion = true;
                enemy.hp--;
                createExplosion(projectile.x, projectile.y, '#f1c40f');

                if (enemy.hp <= 0) {
                    enemy.markedForDeletion = true;
                    score += 100;
                    scoreEl.innerText = score;
                    createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#e74c3c');

                    // Drop Item Chance (20%)
                    if (Math.random() < 0.2) {
                        const type = Math.random() < 0.7 ? 'WEAPON' : 'HEALTH';
                        items.push(new Item(enemy.x, enemy.y, type));
                    }
                }
            }
        });
    });

    // Enemies hit Player
    enemies.forEach(enemy => {
        if (!enemy.markedForDeletion) {
            if (
                player.x < enemy.x + enemy.width &&
                player.x + player.width > enemy.x &&
                player.y < enemy.y + enemy.height &&
                player.height + player.y > enemy.y
            ) {
                enemy.markedForDeletion = true;
                player.takeDamage(20);
                createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#fff');
            }
        }
    });

    // Items hit Player
    items.forEach(item => {
        if (!item.markedForDeletion) {
            if (
                player.x < item.x + item.width &&
                player.x + player.width > item.x &&
                player.y < item.y + item.height &&
                player.height + player.y > item.y
            ) {
                item.markedForDeletion = true;
                if (item.type === 'WEAPON') {
                    player.weaponLevel = Math.min(player.weaponLevel + 1, 3); // Max Level 3
                    score += 50;
                    // Visual feedback for pickup
                    createExplosion(player.x + player.width / 2, player.y, '#f39c12');
                } else if (item.type === 'HEALTH') {
                    player.hp = Math.min(player.hp + 30, player.maxHp);
                    healthFillEl.style.width = `${(player.hp / player.maxHp) * 100}%`;
                }
                scoreEl.innerText = score;
            }
        }
    });
}

function endGame() {
    gameState = 'GAMEOVER';
    finalScoreEl.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

function animate() {
    if (gameState !== 'PLAYING') return;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

    // Starfield Background
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 3; i++) { // Draw a few stars per frame for trail effect, or persistent stars better?
        // Simulating speed lines for "moving up"
        let sx = Math.random() * canvas.width;
        let sy = Math.random() * canvas.height;
        let sl = Math.random() * 20 + 5;
        ctx.globalAlpha = 0.2;
        ctx.fillRect(sx, sy, 1, sl);
        ctx.globalAlpha = 1.0;
    }

    player.update();
    player.draw();

    projectiles.forEach(p => p.update());
    projectiles.forEach(p => p.draw());

    enemies.forEach(e => e.update());
    enemies.forEach(e => e.draw());

    items.forEach(i => i.update());
    items.forEach(i => i.draw());

    particles.forEach(p => p.update());
    particles.forEach(p => p.draw());

    checkCollisions();
    spawnEnemies();

    // Clean up
    projectiles = projectiles.filter(p => !p.markedForDeletion);
    enemies = enemies.filter(e => !e.markedForDeletion);
    particles = particles.filter(p => !p.markedForDeletion);
    items = items.filter(i => !i.markedForDeletion);

    frames++;
    animationId = requestAnimationFrame(animate);
}

// Event Listeners
startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    initGame();
});

restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    initGame();
});
