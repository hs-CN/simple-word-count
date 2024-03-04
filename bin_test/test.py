import os
import sys
import socket
import subprocess

subprocess.run("cargo b --release", cwd="..", shell=False)


if sys.platform == "win32":
    release = "../target/release/simple-word-count.exe"
else:
    release = "../target/release/simple-word-count"


if os.path.exists(release):
    process = subprocess.Popen(release, stdout=subprocess.PIPE, shell=False)
    port = int(process.stdout.readline().decode("utf-8")[:-1])
    print(port)

    tcp = socket.socket()
    tcp.connect(("127.0.0.1", port))

    with open("../LICENSE", "r") as f:
        content = f.read().encode("utf-8")
    tcp.sendall(f"txt;str;1;{len(content)}\n".encode("utf-8"))
    tcp.sendall(content)
    print(tcp.recv(1024))

    content = os.path.abspath("../LICENSE").encode("utf-8")
    tcp.sendall(f"txt;file;2;{len(content)}\n".encode("utf-8"))
    tcp.sendall(content)
    print(tcp.recv(1024))

    # close service
    tcp.sendall("\n".encode("utf-8"))
