import pygame
import sys
import random

# 初始化Pygame
pygame.init()

# 设置常量
CELL_SIZE = 12  # 每个格子的大小
GRID_SIZE = 50  # 网格大小 (50x50)
PADDING = 20    # 边距

# 计算窗口大小
WINDOW_SIZE = CELL_SIZE * GRID_SIZE + 2 * PADDING
WINDOW_COLOR = (255, 255, 255)  # 白色背景
GRID_COLOR = (200, 200, 200)    # 灰色网格线
SNAKE_COLOR = (50, 205, 50)     # 蛇的颜色
NORMAL_FOOD_COLOR = (255, 0, 0)  # 普通食物颜色（红色）
SUPER_FOOD_COLOR = (255, 255, 0) # 大食物颜色（黄色）
SLOW_FOOD_COLOR = (0, 0, 255)    # 减速食物颜色（蓝色）
OBSTACLE_COLOR = (128, 128, 128) # 障碍物颜色（灰色）
TEXT_COLOR = (0, 0, 0)          # 文字颜色
BUTTON_COLOR = (200, 200, 200)  # 按钮颜色
BUTTON_HOVER_COLOR = (180, 180, 180)  # 按钮悬停颜色

# 方向
UP = (0, -1)
DOWN = (0, 1)
LEFT = (-1, 0)
RIGHT = (1, 0)

# 食物类型
NORMAL_FOOD = 'normal'  # 普通食物
SUPER_FOOD = 'super'    # 大食物
SLOW_FOOD = 'slow'      # 减速食物

# 创建窗口
screen = pygame.display.set_mode((WINDOW_SIZE, WINDOW_SIZE))
pygame.display.set_caption("贪吃蛇游戏")

# 创建字体
font = pygame.font.Font(None, 36)
small_font = pygame.font.Font(None, 24)

class Button:
    def __init__(self, x, y, width, height, text, direction=None):
        self.rect = pygame.Rect(x, y, width, height)
        self.text = text
        self.direction = direction
        self.hovered = False

    def draw(self):
        color = BUTTON_HOVER_COLOR if self.hovered else BUTTON_COLOR
        pygame.draw.rect(screen, color, self.rect)
        pygame.draw.rect(screen, TEXT_COLOR, self.rect, 2)
        text_surface = small_font.render(self.text, True, TEXT_COLOR)
        text_rect = text_surface.get_rect(center=self.rect.center)
        screen.blit(text_surface, text_rect)

    def handle_event(self, event):
        if event.type == pygame.MOUSEMOTION:
            self.hovered = self.rect.collidepoint(event.pos)
        elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if self.rect.collidepoint(event.pos):
                return self.direction
        return None

class Snake:
    def __init__(self):
        self.reset()
    
    def reset(self):
        self.position = [(GRID_SIZE // 2, GRID_SIZE // 2)]
        self.direction = RIGHT
        self.next_direction = RIGHT
        self.length = 1
        self.speed_multiplier = 1.0
        
    def update(self, obstacles):
        self.direction = self.next_direction
        
        new_head = (
            (self.position[0][0] + self.direction[0]) % GRID_SIZE,
            (self.position[0][1] + self.direction[1]) % GRID_SIZE
        )
        
        # 检查是否撞到自己或障碍物
        if new_head in self.position or new_head in obstacles:
            return True
            
        self.position.insert(0, new_head)
        if len(self.position) > self.length:
            self.position.pop()
            
        return False
        
    def grow(self):
        self.length += 1

class Game:
    def __init__(self):
        self.create_direction_buttons()
        self.reset()
        
    def create_direction_buttons(self):
        button_size = 40
        spacing = 10
        base_x = WINDOW_SIZE - 3 * (button_size + spacing)
        base_y = WINDOW_SIZE - 2 * (button_size + spacing)
        
        self.buttons = [
            Button(base_x + button_size + spacing, base_y - (button_size + spacing), 
                  button_size, button_size, "↑", UP),
            Button(base_x + button_size + spacing, base_y + button_size + spacing, 
                  button_size, button_size, "↓", DOWN),
            Button(base_x, base_y, button_size, button_size, "←", LEFT),
            Button(base_x + 2 * (button_size + spacing), base_y, 
                  button_size, button_size, "→", RIGHT)
        ]
        
    def reset(self):
        self.snake = Snake()
        self.score = 0
        self.foods = []
        self.obstacles = []
        self.game_over = False
        self.paused = False
        self.base_speed = 10
        self.generate_obstacles()
        self.generate_foods()
        
    def generate_obstacles(self):
        self.obstacles = []
        for _ in range(10):  # 生成10个障碍物
            while True:
                pos = (random.randint(0, GRID_SIZE-1), random.randint(0, GRID_SIZE-1))
                if pos not in self.obstacles and pos not in self.snake.position:
                    self.obstacles.append(pos)
                    break
    
    def generate_foods(self):
        self.foods = []
        food_types = [NORMAL_FOOD] * 6 + [SUPER_FOOD] * 2 + [SLOW_FOOD] * 2  # 比例分配
        random.shuffle(food_types)
        
        while len(self.foods) < 10:  # 总共10个食物
            pos = (random.randint(0, GRID_SIZE-1), random.randint(0, GRID_SIZE-1))
            if (pos not in [f[0] for f in self.foods] and 
                pos not in self.snake.position and 
                pos not in self.obstacles):
                food_type = food_types[len(self.foods)]
                self.foods.append((pos, food_type))
    
    def get_current_speed(self):
        # 每20分增加一点速度，最高速度限制在原始速度的2倍
        speed_increase = min(self.score // 20, 10)
        return min(self.base_speed + speed_increase, self.base_speed * 2) * self.snake.speed_multiplier
    
    def update(self):
        if self.game_over or self.paused:
            return
            
        if self.snake.update(self.obstacles):
            self.game_over = True
            return
            
        # 检查是否吃到食物
        snake_head = self.snake.position[0]
        for food in self.foods[:]:
            if snake_head == food[0]:
                self.foods.remove(food)
                self.snake.grow()
                
                # 根据食物类型给予不同效果
                if food[1] == NORMAL_FOOD:
                    self.score += 10
                elif food[1] == SUPER_FOOD:
                    self.score += 20
                elif food[1] == SLOW_FOOD:
                    self.score += 5
                    self.snake.speed_multiplier = 0.8  # 减速效果
                
                if not self.foods:
                    self.generate_foods()
                    self.snake.speed_multiplier = 1.0  # 重置速度
                break
                
    def draw(self):
        # 填充白色背景
        screen.fill(WINDOW_COLOR)
        
        # 绘制网格
        for x in range(GRID_SIZE + 1):
            pygame.draw.line(screen, GRID_COLOR,
                           (x * CELL_SIZE + PADDING, PADDING),
                           (x * CELL_SIZE + PADDING, WINDOW_SIZE - PADDING))
            pygame.draw.line(screen, GRID_COLOR,
                           (PADDING, x * CELL_SIZE + PADDING),
                           (WINDOW_SIZE - PADDING, x * CELL_SIZE + PADDING))
        
        # 绘制障碍物
        for obstacle in self.obstacles:
            x = obstacle[0] * CELL_SIZE + PADDING
            y = obstacle[1] * CELL_SIZE + PADDING
            pygame.draw.rect(screen, OBSTACLE_COLOR,
                           (x, y, CELL_SIZE, CELL_SIZE))
        
        # 绘制食物
        for food in self.foods:
            x = food[0][0] * CELL_SIZE + PADDING
            y = food[0][1] * CELL_SIZE + PADDING
            color = {
                NORMAL_FOOD: NORMAL_FOOD_COLOR,
                SUPER_FOOD: SUPER_FOOD_COLOR,
                SLOW_FOOD: SLOW_FOOD_COLOR
            }[food[1]]
            pygame.draw.rect(screen, color, (x, y, CELL_SIZE, CELL_SIZE))
        
        # 绘制蛇
        for segment in self.snake.position:
            x = segment[0] * CELL_SIZE + PADDING
            y = segment[1] * CELL_SIZE + PADDING
            pygame.draw.rect(screen, SNAKE_COLOR,
                           (x, y, CELL_SIZE, CELL_SIZE))
        
        # 绘制方向按钮
        for button in self.buttons:
            button.draw()
        
        # 显示分数
        score_text = font.render(f'分数: {self.score}', True, TEXT_COLOR)
        screen.blit(score_text, (PADDING, 5))
        
        # 显示操作说明
        if self.paused:
            instructions = [
                "游戏已暂停",
                "按 P 键继续游戏",
                "方向键或点击按钮控制方向",
                "红色食物: +10分",
                "黄色食物: +20分",
                "蓝色食物: +5分并减速",
                f"当前速度: {int(self.get_current_speed())}"
            ]
            
            for i, text in enumerate(instructions):
                instruction_text = small_font.render(text, True, TEXT_COLOR)
                screen.blit(instruction_text, 
                          (WINDOW_SIZE//2 - 100, WINDOW_SIZE//2 - 80 + i*25))
        
        # 如果游戏结束，显示游戏结束信息和重新开始按钮
        if self.game_over:
            game_over_text = font.render('游戏结束!', True, TEXT_COLOR)
            restart_text = font.render('按空格键重新开始', True, TEXT_COLOR)
            
            text_rect = game_over_text.get_rect(center=(WINDOW_SIZE//2, WINDOW_SIZE//2 - 20))
            restart_rect = restart_text.get_rect(center=(WINDOW_SIZE//2, WINDOW_SIZE//2 + 20))
            
            screen.blit(game_over_text, text_rect)
            screen.blit(restart_text, restart_rect)
        
        pygame.display.flip()

def main():
    clock = pygame.time.Clock()
    game = Game()
    
    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            elif event.type == pygame.KEYDOWN:
                if game.game_over and event.key == pygame.K_SPACE:
                    game.reset()
                elif event.key == pygame.K_p:  # P键暂停/继续
                    game.paused = not game.paused
                elif not game.game_over and not game.paused:
                    if event.key == pygame.K_UP and game.snake.direction != DOWN:
                        game.snake.next_direction = UP
                    elif event.key == pygame.K_DOWN and game.snake.direction != UP:
                        game.snake.next_direction = DOWN
                    elif event.key == pygame.K_LEFT and game.snake.direction != RIGHT:
                        game.snake.next_direction = LEFT
                    elif event.key == pygame.K_RIGHT and game.snake.direction != LEFT:
                        game.snake.next_direction = RIGHT
            
            # 处理方向按钮点击
            if not game.game_over and not game.paused:
                for button in game.buttons:
                    direction = button.handle_event(event)
                    if direction and direction != (-game.snake.direction[0], -game.snake.direction[1]):
                        game.snake.next_direction = direction
        
        game.update()
        game.draw()
        clock.tick(game.get_current_speed())  # 动态调整游戏速度

if __name__ == "__main__":
    main()