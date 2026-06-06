"use strict";

const GAME_CONFIG = {
    player: { width: 50, height: 50, color: "#3498db", speed: 5, maxSpeed: 8 },
    enemy: { width: 40, height: 40, color: "#e74c3c", baseSpeed: 2, maxSpeed: 6, spawnRateBase: 2000, spawnRateMin: 500 },
    bullet: { width: 5, height: 15, color: "#2ecc71", baseSpeed: 7, maxSpeed: 12 },
    powerUp: {
        width: 30, height: 30, spawnRate: 10000,
        types: {
            shield: { color: "#f1c40f", duration: 5000, id: 'shield', name: 'Escudo' },
            speed: { color: "#9b59b6", duration: 5000, multiplier: 2, id: 'speed', name: 'Velocidade' }
        }
    },
    game: { maxEnemies: 10, maxBullets: 5, scorePerEnemy: 20, scoreMultiplier: 1.1, levelUpThreshold: 100 }
};

class GameState {
    constructor() {
        this.reset();
        this.highScore = parseInt(localStorage.getItem('highScore') || '0', 10);
        this.leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    }

    reset() {
        this.playerName = "";
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameTime = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.isPlaying = false;

        // Dynamically scaled properties
        this.currentEnemySpeed = GAME_CONFIG.enemy.baseSpeed;
        this.currentEnemySpawnRate = GAME_CONFIG.enemy.spawnRateBase;
        this.currentBulletSpeed = GAME_CONFIG.bullet.baseSpeed;
    }

    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore.toString());
            return true;
        }
        return false;
    }

    saveScore() {
        if (!this.playerName) return;
        this.leaderboard.push({
            name: this.playerName,
            score: this.score,
            level: this.level,
            time: this.gameTime,
            date: new Date().toISOString()
        });
        localStorage.setItem('leaderboard', JSON.stringify(this.leaderboard));
    }
}

class UIManager {
    constructor(gameState) {
        this.state = gameState;
        this.elements = {
            playerName: document.getElementById("player-name"),
            playerForm: document.getElementById("player-form"),
            gameContainer: document.getElementById("game"),
            scoreDisplay: document.getElementById("score-display"),
            levelDisplay: document.getElementById("level-display"),
            livesDisplay: document.getElementById("lives-display"),
            timeDisplay: document.getElementById("game-time"),
            highScore: document.getElementById("high-score"),
            currentScore: document.getElementById("current-score"),
            pauseMenu: document.getElementById("pause-menu"),
            playAgainBtn: document.getElementById("play-again"),
            pauseBtn: document.getElementById("pause-game"),
            container: document.getElementById("game-container"),
            tableBody: document.getElementById("score-table-body")
        };
    }

    showMessage(message, duration = 2000) {
        const msgEl = document.createElement('div');
        msgEl.className = 'game-message';
        msgEl.textContent = message;
        this.elements.container.appendChild(msgEl);
        setTimeout(() => msgEl.remove(), duration);
    }

    updateHUD() {
        this.elements.scoreDisplay.textContent = `Pontuação: ${this.state.score}`;
        this.elements.currentScore.textContent = `Pontuação Atual: ${this.state.score}`;
        this.elements.levelDisplay.textContent = `Nível: ${this.state.level}`;
        this.elements.livesDisplay.textContent = `Vidas: ${this.state.lives}`;
        this.elements.timeDisplay.textContent = `Tempo: ${this.formatTime(this.state.gameTime)}`;
        this.elements.highScore.textContent = `Recorde: ${this.state.highScore}`;
    }

    formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }

    togglePauseMenu(show) {
        this.elements.pauseMenu.style.display = show ? "block" : "none";
        if (show) {
            document.getElementById("pause-score").textContent = this.state.score;
            document.getElementById("pause-level").textContent = this.state.level;
            document.getElementById("pause-lives").textContent = this.state.lives;
            document.getElementById("pause-time").textContent = this.formatTime(this.state.gameTime);
        }
    }

    renderLeaderboard(filter = 'highest') {
        let sorted = [...this.state.leaderboard];
        if (filter === 'highest') sorted.sort((a, b) => b.score - a.score);
        else if (filter === 'lowest') sorted.sort((a, b) => a.score - b.score);
        else if (filter === 'recent') sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
        else if (filter === 'oldest') sorted.sort((a, b) => new Date(a.date) - new Date(b.date));

        this.elements.tableBody.innerHTML = '';
        sorted.forEach(entry => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${entry.name}</td><td>${entry.score}</td><td>${entry.level}</td><td>${this.formatTime(entry.time)}</td>`;
            this.elements.tableBody.appendChild(tr);
        });
    }

    showStartScreen() {
        this.elements.playerForm.style.display = "block";
        this.elements.gameContainer.style.display = "none";
        this.elements.pauseMenu.style.display = "none";
        this.elements.playAgainBtn.style.display = "none";
        this.elements.pauseBtn.style.display = "none";
    }

    showGameScreen() {
        this.elements.playerForm.style.display = "none";
        this.elements.gameContainer.style.display = "block";
        this.elements.playAgainBtn.style.display = "none";
        this.elements.pauseBtn.style.display = "inline-block";
        this.updateHUD();
    }
}

class GameEngine {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.state = new GameState();
        this.ui = new UIManager(this.state);

        this.keys = {};
        this.entities = { player: null, bullets: [], enemies: [], powerUps: [] };
        this.timers = { lastEnemy: 0, lastPowerUp: 0, gameTimerId: null };
        this.loopId = null;
        this.lastFrameTime = 0;
        this.fpsIterval = 1000 / 60;

        this._bindEvents();
        this.ui.showStartScreen();
        this.ui.renderLeaderboard();
    }

    _bindEvents() {
        window.addEventListener("keydown", (e) => this.handleKeyDown(e));
        window.addEventListener("keyup", (e) => this.keys[e.code] = false);

        // Map global UI functions that index.html expects
        window.startGame = () => this.start();
        window.resetGame = () => this.reset();
        window.togglePause = () => this.togglePause();
        window.sortScores = (filter) => this.ui.renderLeaderboard(filter);

        // Stubs for unimplmented HTML buttons
        window.showSettings = () => this.ui.showMessage("Configurações não implementadas", 1500);
        window.showLeaderboard = () => { this.togglePause(); window.location.hash = "#tabela"; };
        window.showAchievements = () => this.ui.showMessage("Conquistas em breve!", 1500);
    }

    handleKeyDown(e) {
        if (!this.state.isPlaying) return;
        this.keys[e.code] = true;

        if (e.code === "Space") {
            e.preventDefault();
            this.shoot();
        } else if (e.code === "Escape" && !this.state.isGameOver) {
            e.preventDefault();
            this.togglePause();
        }
    }

    start() {
        const name = this.ui.elements.playerName.value.trim();
        if (!name) {
            this.ui.showMessage("Por favor, insira seu nome.");
            return;
        }

        this.state.reset();
        this.state.playerName = name;
        this.state.isPlaying = true;

        this._initEntities();
        this.ui.showGameScreen();

        this.timers.gameTimerId = setInterval(() => {
            if (!this.state.isPaused && !this.state.isGameOver) {
                this.state.gameTime++;
                this.ui.elements.timeDisplay.textContent = `Tempo: ${this.ui.formatTime(this.state.gameTime)}`;
            }
        }, 1000);

        this.lastFrameTime = performance.now();
        this.loopId = requestAnimationFrame((ts) => this.loop(ts));
    }

    reset() {
        if (this.timers.gameTimerId) clearInterval(this.timers.gameTimerId);
        if (this.loopId) cancelAnimationFrame(this.loopId);
        this.ui.showStartScreen();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.state.isPlaying = false;
    }

    togglePause() {
        if (this.state.isGameOver || !this.state.isPlaying) return;

        this.state.isPaused = !this.state.isPaused;
        this.ui.togglePauseMenu(this.state.isPaused);

        if (!this.state.isPaused) {
            this.lastFrameTime = performance.now();
            this.loopId = requestAnimationFrame((ts) => this.loop(ts));
        } else {
            cancelAnimationFrame(this.loopId);
        }
    }

    gameOver() {
        this.state.isGameOver = true;
        this.state.isPlaying = false;
        clearInterval(this.timers.gameTimerId);

        const recordBeaten = this.state.updateHighScore();
        if (recordBeaten) this.ui.showMessage('Novo recorde!', 3000);

        this.state.saveScore();
        this.ui.renderLeaderboard();
        this.ui.updateHUD();

        this.ctx.save();
        this.ctx.font = "30px 'Press Start 2P', sans-serif";
        this.ctx.fillStyle = "#e74c3c";
        this.ctx.textAlign = "center";
        this.ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2 - 20);
        this.ctx.fillText(`Pontuação: ${this.state.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.ctx.restore();

        this.ui.elements.playAgainBtn.style.display = "inline-block";
        this.ui.elements.pauseBtn.style.display = "none";
    }

    _initEntities() {
        this.entities.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 30 - GAME_CONFIG.player.height, // Stay above bottom
            width: GAME_CONFIG.player.width,
            height: GAME_CONFIG.player.height,
            speed: GAME_CONFIG.player.speed,
            hasShield: false,
            shieldTimeout: null,
            speedTimeout: null
        };
        this.entities.bullets = [];
        this.entities.enemies = [];
        this.entities.powerUps = [];
    }

    shoot() {
        if (this.state.isPaused || this.state.isGameOver || this.entities.bullets.length >= GAME_CONFIG.game.maxBullets) return;
        this.entities.bullets.push({
            x: this.entities.player.x + (this.entities.player.width / 2) - (GAME_CONFIG.bullet.width / 2),
            y: this.entities.player.y,
            width: GAME_CONFIG.bullet.width,
            height: GAME_CONFIG.bullet.height
        });
    }

    spawnEntities(now) {
        // Spawn Enemies
        if (now - this.timers.lastEnemy > this.state.currentEnemySpawnRate && this.entities.enemies.length < GAME_CONFIG.game.maxEnemies) {
            this.entities.enemies.push({
                x: Math.random() * (this.canvas.width - GAME_CONFIG.enemy.width),
                y: -GAME_CONFIG.enemy.height,
                width: GAME_CONFIG.enemy.width,
                height: GAME_CONFIG.enemy.height
            });
            this.timers.lastEnemy = now;
        }

        // Spawn Powerups
        if (now - this.timers.lastPowerUp > GAME_CONFIG.powerUp.spawnRate) {
            const types = Object.keys(GAME_CONFIG.powerUp.types);
            const typeKey = types[Math.floor(Math.random() * types.length)];
            this.entities.powerUps.push({
                x: Math.random() * (this.canvas.width - GAME_CONFIG.powerUp.width),
                y: -GAME_CONFIG.powerUp.height,
                width: GAME_CONFIG.powerUp.width,
                height: GAME_CONFIG.powerUp.height,
                data: GAME_CONFIG.powerUp.types[typeKey]
            });
            this.timers.lastPowerUp = now;
        }
    }

    update() {
        // Player move
        const p = this.entities.player;
        if (this.keys["ArrowLeft"] && p.x > 0) p.x -= p.speed;
        if (this.keys["ArrowRight"] && p.x < this.canvas.width - p.width) p.x += p.speed;

        // Bullets
        for (let i = this.entities.bullets.length - 1; i >= 0; i--) {
            let b = this.entities.bullets[i];
            b.y -= this.state.currentBulletSpeed;
            if (b.y < -b.height) this.entities.bullets.splice(i, 1);
        }

        // Enemies
        for (let i = this.entities.enemies.length - 1; i >= 0; i--) {
            let e = this.entities.enemies[i];
            e.y += this.state.currentEnemySpeed;
            if (e.y > this.canvas.height) {
                this.entities.enemies.splice(i, 1);
                this.processDamage();
            }
        }

        // PowerUps
        for (let i = this.entities.powerUps.length - 1; i >= 0; i--) {
            let pUp = this.entities.powerUps[i];
            pUp.y += 2; // fixed fallback speed
            if (pUp.y > this.canvas.height) {
                this.entities.powerUps.splice(i, 1);
            }
        }

        this.checkCollisions();
    }

    rectIntersect(r1, r2) {
        return !(r2.x > r1.x + r1.width || r2.x + r2.width < r1.x || r2.y > r1.y + r1.height || r2.y + r2.height < r1.y);
    }

    checkCollisions() {
        const p = this.entities.player;

        // Bullets vs Enemies
        for (let i = this.entities.bullets.length - 1; i >= 0; i--) {
            let bulletHit = false;
            for (let j = this.entities.enemies.length - 1; j >= 0; j--) {
                if (this.rectIntersect(this.entities.bullets[i], this.entities.enemies[j])) {
                    this.entities.enemies.splice(j, 1);
                    bulletHit = true;
                    this.addScore(Math.floor(GAME_CONFIG.game.scorePerEnemy * GAME_CONFIG.game.scoreMultiplier));
                    break;
                }
            }
            if (bulletHit) this.entities.bullets.splice(i, 1);
        }

        // Player vs Enemies
        for (let i = this.entities.enemies.length - 1; i >= 0; i--) {
            if (this.rectIntersect(p, this.entities.enemies[i])) {
                this.entities.enemies.splice(i, 1);
                if (!p.hasShield) {
                    this.processDamage();
                }
            }
        }

        // Player vs Powerups
        for (let i = this.entities.powerUps.length - 1; i >= 0; i--) {
            if (this.rectIntersect(p, this.entities.powerUps[i])) {
                const pUp = this.entities.powerUps[i].data;
                this.entities.powerUps.splice(i, 1);
                this.applyPowerUp(pUp);
            }
        }
    }

    processDamage() {
        this.state.lives--;
        this.ui.updateHUD();
        if (this.state.lives <= 0) {
            this.gameOver();
        } else {
            this.ui.showMessage('Dano recebido!', 1500);
        }
    }

    addScore(points) {
        this.state.score += points;

        const newLvl = Math.floor(this.state.score / GAME_CONFIG.game.levelUpThreshold) + 1;
        if (newLvl > this.state.level) {
            this.state.level = newLvl;

            // Increase Difficulty
            this.state.currentEnemySpeed = Math.min(GAME_CONFIG.enemy.maxSpeed, this.state.currentEnemySpeed + 0.5);
            this.state.currentEnemySpawnRate = Math.max(GAME_CONFIG.enemy.spawnRateMin, this.state.currentEnemySpawnRate - 200);
            this.state.currentBulletSpeed = Math.min(GAME_CONFIG.bullet.maxSpeed, this.state.currentBulletSpeed + 0.5);

            this.ui.showMessage(`Nível ${this.state.level} alcançado!`, 2000);
        }
        this.ui.updateHUD();
    }

    applyPowerUp(pUpType) {
        const p = this.entities.player;
        this.ui.showMessage(`Power-up ativado: ${pUpType.name}`);

        if (pUpType.id === 'shield') {
            p.hasShield = true;
            if (p.shieldTimeout) clearTimeout(p.shieldTimeout);
            p.shieldTimeout = setTimeout(() => { p.hasShield = false; }, pUpType.duration);
        } else if (pUpType.id === 'speed') {
            p.speed = GAME_CONFIG.player.speed * pUpType.multiplier;
            if (p.speedTimeout) clearTimeout(p.speedTimeout);
            p.speedTimeout = setTimeout(() => { p.speed = GAME_CONFIG.player.speed; }, pUpType.duration);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Player
        const p = this.entities.player;
        this.ctx.fillStyle = GAME_CONFIG.player.color;
        this.ctx.fillRect(p.x, p.y, p.width, p.height);

        if (p.hasShield) {
            this.ctx.strokeStyle = GAME_CONFIG.powerUp.types.shield.color;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(p.x - 5, p.y - 5, p.width + 10, p.height + 10);
        }

        // Draw Bullets
        this.ctx.fillStyle = GAME_CONFIG.bullet.color;
        this.entities.bullets.forEach(b => this.ctx.fillRect(b.x, b.y, b.width, b.height));

        // Draw Enemies
        this.ctx.fillStyle = GAME_CONFIG.enemy.color;
        this.entities.enemies.forEach(e => this.ctx.fillRect(e.x, e.y, e.width, e.height));

        // Draw PowerUps
        this.entities.powerUps.forEach(pUp => {
            this.ctx.fillStyle = pUp.data.color;
            this.ctx.fillRect(pUp.x, pUp.y, pUp.width, pUp.height);
        });
    }

    loop(timestamp) {
        if (this.state.isGameOver || this.state.isPaused) return;

        const deltaTime = timestamp - this.lastFrameTime;
        if (deltaTime >= this.fpsIterval) {
            this.update();
            this.spawnEntities(Date.now());
            this.draw();
            this.lastFrameTime = timestamp - (deltaTime % this.fpsIterval);
        }
        this.loopId = requestAnimationFrame((ts) => this.loop(ts));
    }
}

// Bootstrap
window.onload = () => {
    new GameEngine();
};