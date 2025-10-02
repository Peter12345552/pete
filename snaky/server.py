from http.server import HTTPServer, SimpleHTTPRequestHandler
import webbrowser
import os
import sys
import socket

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_GET(self):
        try:
            super().do_GET()
        except Exception as e:
            self.send_error(500, str(e))

def find_free_port(start_port=8000, max_port=8999):
    for port in range(start_port, max_port + 1):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return port
        except OSError:
            continue
    raise RuntimeError("没有找到可用的端口")

def run(server_class=HTTPServer, handler_class=CORSRequestHandler):
    try:
        port = find_free_port()
        server_address = ('', port)
        httpd = server_class(server_address, handler_class)
        print(f"启动服务器，端口 {port}...")
        print(f"请访问 http://localhost:{port}")
        print("按 Ctrl+C 停止服务器")
        webbrowser.open(f'http://localhost:{port}')
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n正在关闭服务器...")
        httpd.server_close()
        sys.exit(0)
    except Exception as e:
        print(f"错误: {e}")
        sys.exit(1)

if __name__ == '__main__':
    # 确保工作目录是脚本所在目录
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    run()