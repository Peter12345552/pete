// 游戏常量
const GAME_TIME_LIMIT = 120; // 2分钟 = 120秒
const CELL_SIZE = 20;
const GRID_SIZE = 20;
const CANVAS_SIZE = CELL_SIZE * GRID_SIZE;
const INITIAL_SNAKE_LENGTH = 3;
const BASE_SPEED = 250; // 增加基础速度值（数值越大，移动越慢）
const MAX_SPEED = BASE_SPEED / 1.5; // 调整最大速度，使其不会太快
const SCORE_THRESHOLD = 30; // 增加分数阈值，让速度变化更平缓

// 颜色定义
const COLORS = {
    SNAKE: '#4CAF50',
    BACKGROUND: '#000000',
    GRID: '#1a1a1a',
    RED_FOOD: '#ff0000',
    YELLOW_FOOD: '#ffff00',
    BLUE_FOOD: '#0000ff',
    OBSTACLE: '#808080',
    TEXT: '#ffffff'
};

// 方向映射
const DIRECTIONS = {
    37: { x: -1, y: 0 }, // 左
    38: { x: 0, y: -1 }, // 上
    39: { x: 1, y: 0 },  // 右
    40: { x: 0, y: 1 }   // 下
};

// 食物类型
const FOOD_TYPES = {
    RED: { color: COLORS.RED_FOOD, points: 10 },
    YELLOW: { color: COLORS.YELLOW_FOOD, points: 20 },
    BLUE: { color: COLORS.BLUE_FOOD, points: 5 }
};

class Snake {
    constructor() {
        this.reset();
    }

    reset() {
        this.body = [];
        const centerX = Math.floor(GRID_SIZE / 2);
        const centerY = Math.floor(GRID_SIZE / 2);
        for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
            this.body.push({ x: centerX - i, y: centerY });
        }
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
    }

    changeDirection(newDirection) {
        if (this.direction.x + newDirection.x !== 0 || this.direction.y + newDirection.y !== 0) {
            this.nextDirection = newDirection;
        }
    }

    move() {
        this.direction = this.nextDirection;
        const head = { x: this.body[0].x + this.direction.x, y: this.body[0].y + this.direction.y };
        this.body.unshift(head);
        return this.body.pop();
    }

    grow() {
        const tail = this.body[this.body.length - 1];
        this.body.push({ ...tail });
    }

    checkCollision(x, y) {
        return this.body.some(segment => segment.x === x && segment.y === y);
    }
}

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.snake = new Snake();
        this.score = 0;
        this.foods = [];
        this.obstacles = [];
        this.isPaused = false;
        this.isGameOver = false;
        this.speed = BASE_SPEED;
        this.elapsedTime = 0;
        this.lastFrameTime = 0;
        this.lastObstacleMoveTime = 0; // 记录上次障碍物移动的时间
        this.setupControls();
        this.generateFoods();
        this.generateObstacles();
    }

    reset() {
        this.snake.reset();
        this.score = 0;
        this.foods = [];
        this.obstacles = [];
        this.isPaused = false;
        this.isGameOver = false;
        this.speed = BASE_SPEED;
        this.elapsedTime = 0;
        this.lastFrameTime = 0;
        this.generateFoods();
        this.generateObstacles();
        this.startGameLoop();
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (e.keyCode === 32 && this.isGameOver) { // 空格键重新开始
                this.reset();
                return;
            }
            if (e.keyCode === 80) { // P键暂停/继续
                this.togglePause();
                return;
            }
            const direction = DIRECTIONS[e.keyCode];
            if (direction) {
                this.snake.changeDirection(direction);
            }
        });

        // 设置屏幕按钮控制
        const buttons = {
            'upBtn': { x: 0, y: -1 },
            'leftBtn': { x: -1, y: 0 },
            'rightBtn': { x: 1, y: 0 },
            'downBtn': { x: 0, y: 1 }
        };

        for (const [id, direction] of Object.entries(buttons)) {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', () => {
                    if (!this.isPaused && !this.isGameOver) {
                        this.snake.changeDirection(direction);
                    }
                });
            }
        }

        // 重新开始按钮
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                if (this.isGameOver) {
                    this.reset();
                }
            });
        }
    }

    generateFoods() {
        this.foods = [];
        const foodCounts = { RED: 6, YELLOW: 2, BLUE: 2 };
        
        for (const [type, count] of Object.entries(foodCounts)) {
            for (let i = 0; i < count; i++) {
                this.generateFood(FOOD_TYPES[type]);
            }
        }
    }

    generateFood(foodType) {
        let x, y;
        do {
            x = Math.floor(Math.random() * GRID_SIZE);
            y = Math.floor(Math.random() * GRID_SIZE);
        } while (
            this.snake.checkCollision(x, y) ||
            this.foods.some(food => food.x === x && food.y === y) ||
            this.obstacles.some(obstacle => obstacle.x === x && obstacle.y === y)
        );
        this.foods.push({ x, y, type: foodType });
    }

    generateObstacles() {
        this.obstacles = [];
        for (let i = 0; i < 10; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * GRID_SIZE);
                y = Math.floor(Math.random() * GRID_SIZE);
            } while (
                this.snake.checkCollision(x, y) ||
                this.foods.some(food => food.x === x && food.y === y) ||
                this.obstacles.some(obstacle => obstacle.x === x && obstacle.y === y)
            );
            this.obstacles.push({ x, y });
        }
    }

    checkCollisions() {
        const head = this.snake.body[0];

        // 检查墙壁碰撞
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            return true;
        }

        // 检查自身碰撞
        for (let i = 1; i < this.snake.body.length; i++) {
            if (head.x === this.snake.body[i].x && head.y === this.snake.body[i].y) {
                return true;
            }
        }

        // 检查障碍物碰撞
        return this.obstacles.some(obstacle => head.x === obstacle.x && head.y === obstacle.y);
    }

    checkFood() {
        const head = this.snake.body[0];
        const foodIndex = this.foods.findIndex(food => food.x === head.x && food.y === head.y);
        
        if (foodIndex !== -1) {
            const food = this.foods[foodIndex];
            this.score += food.type.points;
            this.snake.grow();
            this.foods.splice(foodIndex, 1);
            this.generateFood(food.type);

            // 根据分数调整速度
            if (this.score % SCORE_THRESHOLD === 0) {
                this.speed = Math.max(MAX_SPEED, BASE_SPEED - Math.floor(this.score / SCORE_THRESHOLD) * 10);
            }

            // 如果是蓝色食物，临时减速
            if (food.type === FOOD_TYPES.BLUE) {
                this.speed = BASE_SPEED;
            }
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseScreen = document.getElementById('pauseScreen');
        if (pauseScreen) {
            pauseScreen.style.display = this.isPaused ? 'flex' : 'none';
        }
        if (!this.isPaused) {
            this.lastFrameTime = performance.now();
            this.startGameLoop();
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = COLORS.GRID;
        for (let i = 0; i <= GRID_SIZE; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * CELL_SIZE, 0);
            this.ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * CELL_SIZE);
            this.ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
            this.ctx.stroke();
        }
    }

    draw() {
        // 清空画布
        this.ctx.fillStyle = COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // 绘制网格
        this.drawGrid();

        // 绘制食物
        this.foods.forEach(food => {
            this.ctx.fillStyle = food.type.color;
            this.ctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        });

        // 绘制障碍物
        this.ctx.fillStyle = COLORS.OBSTACLE;
        this.obstacles.forEach(obstacle => {
            this.ctx.fillRect(obstacle.x * CELL_SIZE, obstacle.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        });

        // 绘制蛇
        this.ctx.fillStyle = COLORS.SNAKE;
        this.snake.body.forEach(segment => {
            this.ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        });

        // 更新分数和时间显示
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = `分数: ${this.score}`;
        }

        const timeElement = document.getElementById('timeLeft');
        if (timeElement) {
            const timeLeft = Math.max(0, GAME_TIME_LIMIT - Math.floor(this.elapsedTime / 1000));
            timeElement.textContent = `剩余时间: ${timeLeft}秒`;
        }

        // 游戏结束显示
        if (this.isGameOver) {
            const gameOverScreen = document.getElementById('gameOverScreen');
            if (gameOverScreen) {
                gameOverScreen.style.display = 'flex';
                const finalScore = document.getElementById('finalScore');
                if (finalScore) {
                    finalScore.textContent = `最终得分: ${this.score}`;
                }
            }
        }
    }

    moveObstacles() {
        this.obstacles.forEach(obstacle => {
            // 随机选择移动方向（上、下、左、右）
            const directions = [
                { x: 0, y: -1 }, // 上
                { x: 0, y: 1 },  // 下
                { x: -1, y: 0 }, // 左
                { x: 1, y: 0 }   // 右
            ];
            const direction = directions[Math.floor(Math.random() * directions.length)];
            
            // 计算新位置
            const newX = obstacle.x + direction.x;
            const newY = obstacle.y + direction.y;
            
            // 检查新位置是否有效
            if (this.isValidObstaclePosition(newX, newY)) {
                obstacle.x = newX;
                obstacle.y = newY;
            }
        });
    }

    isValidObstaclePosition(x, y) {
        // 检查是否在网格范围内
        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
            return false;
        }

        // 检查是否与蛇重叠
        if (this.snake.checkCollision(x, y)) {
            return false;
        }

        // 检查是否与食物重叠
        if (this.foods.some(food => food.x === x && food.y === y)) {
            return false;
        }

        // 检查是否与其他障碍物重叠
        if (this.obstacles.some(obs => obs.x === x && obs.y === y)) {
            return false;
        }

        return true;
    }

    startGameLoop() {
        if (this.isPaused || this.isGameOver) return;

        const currentTime = performance.now();
        if (this.lastFrameTime === 0) {
            this.lastFrameTime = currentTime;
            this.lastObstacleMoveTime = currentTime;
        }

        const deltaTime = currentTime - this.lastFrameTime;
        this.elapsedTime += deltaTime;
        this.lastFrameTime = currentTime;

        // 检查时间限制
        if (this.elapsedTime >= GAME_TIME_LIMIT * 1000) {
            this.isGameOver = true;
            this.draw();
            return;
        }

        // 每2秒移动一次障碍物
        if (currentTime - this.lastObstacleMoveTime >= 2000) {
            this.moveObstacles();
            this.lastObstacleMoveTime = currentTime;
        }

        if (this.elapsedTime >= this.lastMoveTime + this.speed) {
            const tail = this.snake.move();
            
            if (this.checkCollisions()) {
                this.isGameOver = true;
                this.draw();
                return;
            }

            this.checkFood();
            this.lastMoveTime = this.elapsedTime;
        }

        this.draw();
        requestAnimationFrame(() => this.startGameLoop());
    }
}

// 游戏初始化
window.onload = () => {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.width = CANVAS_SIZE;
        canvas.height = CANVAS_SIZE;
        const game = new Game(canvas);
        game.startGameLoop();
    }
};