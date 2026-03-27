import socket

def check_port(host, port):
    try:
        s = socket.create_connection((host, port), timeout=1)
        s.close()
        return True
    except Exception as e:
        return False

print(f"Checking 127.0.0.1:8000 (Team 2)... {'OPEN' if check_port('127.0.0.1', 8000) else 'CLOSED'}")
print(f"Checking 127.0.0.1:8001 (Main Gateway)... {'OPEN' if check_port('127.0.0.1', 8001) else 'CLOSED'}")
