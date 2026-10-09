"""Abre la demo «Próxima parada: Iguaque» en el navegador.

Sirve la carpeta docs/ que viene dentro del ejecutable en una dirección local
y abre el navegador. No instala nada ni necesita internet, salvo para los videos.
"""
import http.server
import os
import socket
import sys
import threading
import webbrowser

BASE = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
CARPETA = os.path.join(BASE, 'docs')


class Servidor(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=CARPETA, **k)

    def log_message(self, *a):
        pass


def puerto_libre(preferido=8792):
    for p in (preferido, 0):
        try:
            with socket.socket() as s:
                s.bind(('127.0.0.1', p))
                return s.getsockname()[1]
        except OSError:
            continue


def main():
    puerto = puerto_libre()
    servidor = http.server.ThreadingHTTPServer(('127.0.0.1', puerto), Servidor)
    url = f'http://localhost:{puerto}/'
    print('Proxima parada: Iguaque - CreaMente Digital', flush=True)
    print('', flush=True)
    print('La demo se abrio en el navegador: ' + url, flush=True)
    print('Deje esta ventana abierta mientras la usa.', flush=True)
    print('Para terminar, cierre esta ventana.', flush=True)
    threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
