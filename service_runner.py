#!/usr/bin/env python3
"""
WidgeTDC Service Runner
Starts backend and frontend services concurrently for development
"""

import subprocess
import threading
import sys
import os
import platform
import signal
import time
from pathlib import Path

class ServiceRunner:
    def __init__(self):
        self.processes = []
        self.threads = []

    def run_service(self, name: str, path: str, command: list, env: dict = None):
        """Run a service in a separate thread"""
        def _run():
            try:
                print(f"[{name}] Starting in {path} with command: {' '.join(command)}")
                if not os.path.exists(path):
                    print(f"[{name}] ERROR: Path {path} does not exist!")
                    return

                # Change to the service directory
                os.chdir(path)

                # Use shell=True on Windows for npm commands, otherwise use the command list
                if platform.system() == 'Windows':
                    process = subprocess.Popen(
                        ' '.join(command),
                        shell=True,
                        env=env,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.STDOUT,
                        universal_newlines=True,
                        bufsize=1
                    )
                else:
                    process = subprocess.Popen(
                        command,
                        env=env,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.STDOUT,
                        universal_newlines=True,
                        bufsize=1
                    )

                self.processes.append(process)

                # Stream output in real-time
                while True:
                    output = process.stdout.readline()
                    if output == '' and process.poll() is not None:
                        break
                    if output:
                        print(f"[{name}] {output.strip()}")

                return_code = process.poll()
                if return_code != 0:
                    print(f"[{name}] Process exited with code {return_code}")

            except Exception as e:
                print(f"[{name}] ERROR: {str(e)}")

        thread = threading.Thread(target=_run, daemon=True)
        thread.start()
        self.threads.append(thread)

    def start_services(self):
        """Start all services"""
        project_root = Path(__file__).parent

        # Backend service
        backend_path = project_root / "apps" / "backend"
        self.run_service(
            "BACKEND",
            str(backend_path),
            ["npm", "run", "dev"]
        )

        # Frontend service
        frontend_path = project_root / "apps" / "widget-board"
        self.run_service(
            "FRONTEND",
            str(frontend_path),
            ["npm", "run", "dev"]
        )

    def wait_for_services(self):
        """Wait for all services to be ready"""
        print("\n🚀 Starting WidgeTDC services...")
        print("📊 Backend: http://localhost:3001")
        print("🎨 Frontend: http://localhost:5173")
        print("🛑 Press Ctrl+C to stop all services\n")

        try:
            # Wait for threads to complete (they run indefinitely)
            for thread in self.threads:
                thread.join()
        except KeyboardInterrupt:
            print("\n🛑 Shutting down services...")
            self.stop_services()

    def stop_services(self):
        """Stop all running processes"""
        for process in self.processes:
            try:
                process.terminate()
                # Give it 5 seconds to terminate gracefully
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                print("Force killing process...")
                process.kill()
            except Exception as e:
                print(f"Error stopping process: {e}")

        print("✅ All services stopped")

def main():
    runner = ServiceRunner()
    runner.start_services()
    runner.wait_for_services()

if __name__ == "__main__":
    main()