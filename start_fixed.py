import subprocess
import sys
import os
import platform
import time
import signal
import webbrowser

# --- Konfiguration ---
IS_WINDOWS = platform.system() == "Windows"
NPM_CMD = "npm.cmd" if IS_WINDOWS else "npm"

# Specifikke stier fra WidgeTDC repo
SHARED_PACKAGES = [
    os.path.join("packages", "shared", "mcp-types"),
    os.path.join("packages", "shared", "domain-types")
]
BACKEND_PATH = os.path.join("apps", "backend")
FRONTEND_PATH = os.path.join("apps", "widget-board")

def run_step(command, cwd, name):
    """Kører en installations/build kommando og venter på den er færdig."""
    print(f"[{name}] Working...", end="\r")
    try:
        # Tjek først om mappen findes
        full_path = os.path.abspath(cwd)
        if not os.path.exists(full_path):
            print(f"[ERROR] [{name}] Folder not found: {cwd}")
            return False

        subprocess.check_call(
            command,
            cwd=full_path,
            shell=IS_WINDOWS,
            stdout=subprocess.DEVNULL, # Skjul larmende logs, vis kun fejl
            stderr=sys.stderr
        )
        print(f"[OK] [{name}] Done.")
        return True
    except subprocess.CalledProcessError:
        print(f"[FAILED] [{name}] Run 'npm install' manually to see error.")
        return False

def start_server(command, cwd, name, port):
    """Starter en server i baggrunden."""
    print(f"Starting {name}...")
    process = subprocess.Popen(
        command,
        cwd=os.path.abspath(cwd),
        shell=IS_WINDOWS,
        stdout=sys.stdout,
        stderr=sys.stderr
    )
    return process

def main():
    # Fix encoding for Windows console
    if IS_WINDOWS:
        import sys
        if sys.stdout.encoding != 'utf-8':
            sys.stdout.reconfigure(encoding='utf-8')

    root_dir = os.getcwd()
    print("--- WidgeTDC Auto-Fix & Start Script ---")
    print(f"Root folder: {root_dir}\n")

    # 1. Root Install
    if not run_step([NPM_CMD, "install", "--legacy-peer-deps"], root_dir, "Root Dependencies"):
        sys.exit(1)

    # 2. Build Shared Packages (CRITICAL for WidgeTDC)
    print("\nBuilding shared packages (required for backend)...")
    for path in SHARED_PACKAGES:
        pkg_name = os.path.basename(path)
        if not run_step([NPM_CMD, "install", "--legacy-peer-deps"], path, f"Install {pkg_name}"): sys.exit(1)
        if not run_step([NPM_CMD, "run", "build"], path, f"Build {pkg_name}"): sys.exit(1)

    # 3. Setup Backend
    print("\nSetting up Backend...")
    if not run_step([NPM_CMD, "install", "--legacy-peer-deps"], BACKEND_PATH, "Backend Deps"): sys.exit(1)

    # Fix .env hvis den mangler
    env_path = os.path.join(BACKEND_PATH, ".env")
    if not os.path.exists(env_path):
        try:
            import shutil
            shutil.copy(os.path.join(BACKEND_PATH, ".env.example"), env_path)
            print("Created .env from .env.example")
        except:
            print("[WARNING] Could not create .env file. You may need to do it manually.")

    # Database Seed (Valgfri - kun hvis det ser ud som om databasen er tom)
    # README foreslår: npm run build -> node dist/database/seeds.js
    # Vi springer dette over i "run" scriptet for ikke at overskrive data hver gang.

    # 4. Setup Frontend
    print("\nSetting up Frontend (Widget Board)...")
    if not run_step([NPM_CMD, "install", "--legacy-peer-deps"], FRONTEND_PATH, "Frontend Deps"): sys.exit(1)

    # 5. Start Everything
    print("\nStarting applications...")

    backend_proc = start_server([NPM_CMD, "run", "dev"], BACKEND_PATH, "Backend", 3001)
    time.sleep(5) # Vent på backend booter op (db connection osv.)

    frontend_proc = start_server([NPM_CMD, "run", "dev"], FRONTEND_PATH, "Frontend", 5173)

    print("\nAll systems running!")
    print("Backend:  http://localhost:3001")
    print("Frontend: http://localhost:5173")
    print("\n(Press Ctrl+C to stop)")

    # Åbn browser automatisk
    try:
        webbrowser.open("http://localhost:5173")
    except:
        pass

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping servers...")
        backend_proc.terminate()
        frontend_proc.terminate()
        sys.exit(0)

if __name__ == "__main__":
    main()
