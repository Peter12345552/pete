const CELL_SIZE = 12;
const GRID_SIZE = 50;
const PADDING = 1;
const GAME_TIME_LIMIT = 5 * 60; // 5分钟，以秒为单位

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 设置画布大小
canvas.width = GRID_SIZE * CELL_SIZE;
canvas.height = GRID_SIZE * CELL_SIZE;

// 颜色定义
const COLORS = {
    BACKGROUND: 'white',
    GRID: '#e0e0e0',
    SNAKE: '#4CAF50',
    OBSTACLE: '#808080',
    FOOD: {
        RED: '#ff0000',    // +10分
        YELLOW: '#ffff00', // +20分
        BLUE: '#0000ff'    // +5分并减速
    }
};

// 方向映射
const DIRECTIONS = {
    37: { x: -1, y: 0 },  // 左
    38: { x: 0, y: -1 },  // 上
    39: { x: 1, y: 0 },   // 右
    40: { x: 0, y: 1 }    // 下
};

// 食物类型及其分数
const FOOD_TYPES = {
    RED: { color: COLORS.FOOD.RED, points: 10, count: 6 },
    YELLOW: { color: COLORS.FOOD.YELLOW, points: 20, count: 2 },
    BLUE: { color: COLORS.FOOD.BLUE, points: 5, count: 2 }
};

class Snake {
    constructor() {
        this.reset();
    }

    reset() {
        this.body = [{ x: 25, y: 25 }];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.speedMultiplier = 1;
    }

    update() {
        this.direction = this.nextDirection;
        const head = { x: this.body[0].x + this.direction.x, y: this.body[0].y + this.direction.y };
        
        // 穿墙
        head.x = (head.x + GRID_SIZE) % GRID_SIZE;
        head.y = (head.y + GRID_SIZE) % GRID_SIZE;
        
        this.body.unshift(head);
    }

    changeDirection(newDirection) {
        if (this.direction.x + newDirection.x !== 0 || this.direction.y + newDirection.y !== 0) {
            this.nextDirection = newDirection;
        }
    }

    grow() {
        // 不删除尾部，蛇会自然增长
    }

    shrink() {
        this.body.pop();
    }

    checkCollision(position) {
        return this.body.slice(1).some(segment => segment.x === position.x && segment.y === position.y);
    }
}

class Game {
    constructor() {
        this.snake = new Snake();
        this.score = 0;
        this.food = [];
        this.obstacles = [];
        this.gameOver = false;
        this.paused = false;
        this.baseSpeed = 10;
        this.elapsedTime = 0;
        this.pausedTime = 0;
        this.lastPauseTime = 0;
        this.actualGameTime = 0;
        this.startTime = Date.now();
        
        this.setupControls();
        this.generateObstacles();
        this.generateFood();
        this.startGameLoop();
    }

    reset() {
        this.snake.reset();
        this.score = 0;
        this.food = [];
        this.obstacles = [];
        this.gameOver = false;
        this.paused = false;
        this.elapsedTime = 0;
        this.pausedTime = 0;
        this.actualGameTime = 0;
        this.startTime = Date.now();
        this.generateObstacles();
        this.generateFood();
        this.updateUI();
    }

    generateObstacles() {
        this.obstacles = [];
        while (this.obstacles.length < 10) {
            const obstacle = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
            
            // 确保障碍物不会生成在蛇的位置
            if (!this.snake.checkCollision(obstacle) && 
                !this.obstacles.some(o => o.x === obstacle.x && o.y === obstacle.y)) {
                this.obstacles.push(obstacle);
            }
        }
    }

    generateFood() {
        this.food = [];
        Object.entries(FOOD_TYPES).forEach(([type, info]) => {
            for (let i = 0; i < info.count; i++) {
                while (true) {
                    const food = {
                        x: Math.floor(Math.random() * GRID_SIZE),
                        y: Math.floor(Math.random() * GRID_SIZE),
                        type: type,
                        color: info.color,
                        points: info.points
                    };
                    
                    if (!this.snake.checkCollision(food) && 
                        !this.obstacles.some(o => o.x === food.x && o.y === food.y) &&
                        !this.food.some(f => f.x === food.x && f.y === food.y)) {
                        this.food.push(food);
                        break;
                    }
                }
            }
        });
    }

    setupControls() {
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) {
                if (e.code === 'Space') {
                    this.reset();
                }
                return;
            }

            if (e.keyCode === 80) { // P键暂停
                this.togglePause();
                return;
            }

            if (this.paused) return;

            const direction = DIRECTIONS[e.keyCode];
            if (direction) {
                this.snake.changeDirection(direction);
            }
        });

        // 屏幕按钮控制
        const buttons = {
            'upBtn': { x: 0, y: -1 },
            'leftBtn': { x: -1, y: 0 },
            'rightBtn': { x: 1, y: 0 },
            'downBtn': { x: 0, y: 1 }
        };

        Object.entries(buttons).forEach(([id, direction]) => {
            document.getElementById(id).addEventListener('click', () => {
                if (!this.gameOver && !this.paused) {
                    this.snake.changeDirection(direction);
                }
            });
        });

        // 重新开始按钮
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.reset();
        });

        // 继续游戏按钮
        document.getElementById('continueBtn').addEventListener('click', () => {
            if (this.gameOver) {
                this.elapsedTime = 0;
                this.pausedTime = 0;
                this.actualGameTime = 0;
                this.startTime = Date.now();
                this.gameOver = false;
                this.updateUI();
                document.getElementById('gameOverScreen').classList.add('hidden');
            }
        });
    }

    togglePause() {
        this.paused = !this.paused;
        if (this.paused) {
            this.lastPauseTime = Date.now();
            document.getElementById('pauseScreen').classList.remove('hidden');
        } else {
            this.pausedTime += (Date.now() - this.lastPauseTime) / 1000;
            document.getElementById('pauseScreen').classList.add('hidden');
        }
    }

    checkCollisions() {
        const head = this.snake.body[0];

        // 检查是否撞到障碍物
        if (this.obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y)) {
            return true;
        }

        // 检查是否撞到自己
        if (this.snake.checkCollision(head)) {
            return true;
        }

        // 检查是否吃到食物
        const foodIndex = this.food.findIndex(food => food.x === head.x && food.y === head.y);
        if (foodIndex !== -1) {
            const food = this.food[foodIndex];
            this.score += food.points;
            this.snake.grow();
            
            // 蓝色食物减速效果
            if (food.type === 'BLUE') {
                this.snake.speedMultiplier = Math.max(0.5, this.snake.speedMultiplier - 0.1);
            }
            
            this.food.splice(foodIndex, 1);
            if (this.food.length === 0) {
                this.generateFood();
            }
        } else {
            this.snake.shrink();
        }

        return false;
    }

    updateUI() {
        // 更新分数
        document.getElementById('scoreText').textContent = this.score;
        
        // 更新速度显示
        document.getElementById('speedText').textContent = 
            Math.round(this.baseSpeed * this.snake.speedMultiplier);
        
        // 更新计时器
        const remainingTime = Math.max(0, GAME_TIME_LIMIT - this.elapsedTime);
        const minutes = Math.floor(remainingTime / 60);
        const seconds = Math.floor(remainingTime % 60);
        document.getElementById('timerText').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // 更新暂停时间
        if (this.paused) {
            const currentPauseTime = Math.floor((Date.now() - this.lastPauseTime) / 1000);
            document.getElementById('pausedTime').textContent = 
                `${Math.floor(currentPauseTime / 60)}:${(currentPauseTime % 60).toString().padStart(2, '0')}`;
        }
    }

    draw() {
        // 清空画布
        ctx.fillStyle = COLORS.BACKGROUND;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制网格
        ctx.strokeStyle = COLORS.GRID;
        for (let i = 0; i <= GRID_SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(i * CELL_SIZE, 0);
            ctx.lineTo(i * CELL_SIZE, canvas.height);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * CELL_SIZE);
            ctx.lineTo(canvas.width, i * CELL_SIZE);
            ctx.stroke();
        }

        // 绘制障碍物
        ctx.fillStyle = COLORS.OBSTACLE;
        this.obstacles.forEach(obstacle => {
            ctx.fillRect(
                obstacle.x * CELL_SIZE + PADDING,
                obstacle.y * CELL_SIZE + PADDING,
                CELL_SIZE - 2 * PADDING,
                CELL_SIZE - 2 * PADDING
            );
        });

        // 绘制食物
        this.food.forEach(food => {
            ctx.fillStyle = food.color;
            ctx.fillRect(
                food.x * CELL_SIZE + PADDING,
                food.y * CELL_SIZE + PADDING,
                CELL_SIZE - 2 * PADDING,
                CELL_SIZE - 2 * PADDING
            );
        });

        // 绘制蛇
        ctx.fillStyle = COLORS.SNAKE;
        this.snake.body.forEach(segment => {
            ctx.fillRect(
                segment.x * CELL_SIZE + PADDING,
                segment.y * CELL_SIZE + PADDING,
                CELL_SIZE - 2 * PADDING,
                CELL_SIZE - 2 * PADDING
            );
        });
    }

    endGame() {
        this.gameOver = true;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('finalScore').textContent = this.score;
        
        const totalTime = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        document.getElementById('gameDuration').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const actualTime = Math.floor(this.actualGameTime);
        const actualMinutes = Math.floor(actualTime / 60);
        const actualSeconds = actualTime % 60;
        document.getElementById('actualGameTime').textContent = 
            `${actualMinutes}:${actualSeconds.toString().padStart(2, '0')}`;
    }

    startGameLoop() {
        let lastTime = performance.now();
        const gameLoop = (currentTime) => {
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            if (!this.gameOver && !this.paused) {
                this.elapsedTime += deltaTime;
                this.actualGameTime += deltaTime;

                // 根据分数调整速度
                this.snake.speedMultiplier = Math.min(2, 1 + Math.floor(this.score / 20) * 0.1);

                // 检查时间限制
                if (this.elapsedTime >= GAME_TIME_LIMIT) {
                    this.endGame();
                }

                // 更新游戏状态
                this.snake.update();
                if (this.checkCollisions()) {
                    this.endGame();
                }
            }

            // 更新UI和绘制
            this.updateUI();
            this.draw();

            // 继续游戏循环
            setTimeout(() => {
                requestAnimationFrame(gameLoop);
            }, 1000 / (this.baseSpeed * (this.snake.speedMultiplier || 1)));
        };

        requestAnimationFrame(gameLoop);
    }
}

// 启动游戏
new Game();