import http.server
import socketserver
import webbrowser
import os

# 设置端口
PORT = 8000

# 切换到脚本所在目录
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# 创建处理程序
Handler = http.server.SimpleHTTPRequestHandler

try:
    # 创建服务器
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"服务器启动在端口 {PORT}")
        print(f"请访问: http://localhost:{PORT}")
        
        # 尝试打开浏览器
        try:
            webbrowser.open(f'http://localhost:{PORT}')
        except:
            print("请手动打开浏览器访问上述地址")
        
        # 开始服务
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\n正在关闭服务器...")
except Exception as e:
    print(f"发生错误: {str(e)}")