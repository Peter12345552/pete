from http.server import HTTPServer, SimpleHTTPRequestHandler
import webbrowser
import os
import sys

def run_server():
    # 设置工作目录
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # 使用固定端口8000
    port = 8000
    
    try:
        # 创建服务器
        server = HTTPServer(('localhost', port), SimpleHTTPRequestHandler)
        url = f'http://localhost:{port}'
        
        print(f'启动服务器于 {url}')
        print('按 Ctrl+C 停止服务器')
        
        # 尝试打开浏览器
        try:
            webbrowser.open(url)
        except:
            print(f'请手动在浏览器中访问: {url}')
        
        # 运行服务器
        server.serve_forever()
        
    except Exception as e:
        print(f'错误: {str(e)}')
        sys.exit(1)

if __name__ == '__main__':
    try:
        run_server()
    except KeyboardInterrupt:
        print('\n正在关闭服务器...')
        sys.exit(0)