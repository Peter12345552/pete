from http.server import HTTPServer, SimpleHTTPRequestHandler

def start_server():
    # 使用最基本的设置
    server_address = ('127.0.0.1', 8000)
    handler = SimpleHTTPRequestHandler
    
    print('正在启动服务器...')
    print('服务器地址: http://127.0.0.1:8000')
    print('按 Ctrl+C 可以停止服务器')
    
    # 启动服务器
    server = HTTPServer(server_address, handler)
    server.serve_forever()

if __name__ == '__main__':
    try:
        start_server()
    except KeyboardInterrupt:
        print('\n服务器已停止')