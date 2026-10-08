# Geliştirme sunucusu: python dev/serve.py [port]
# python -m http.server önbellek başlığı göndermediği için tarayıcı değişen ES modüllerini eski
# sürümden kullanabiliyor; burada her yanıt Cache-Control: no-store taşır.
import functools
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class NoStoreHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8047
    handler = functools.partial(NoStoreHandler, directory=ROOT)
    with http.server.ThreadingHTTPServer(('127.0.0.1', port), handler) as srv:
        print(f'http://localhost:{port}')
        srv.serve_forever()
